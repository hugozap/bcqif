/* script que importa un txt de bancolombia y genera el QIF file correspondiente .
 Solo tiene en cuenta el primer registro de una transacción que tenga múltiples cuotas 

Para exportar solo las transacciones en pesos:

USO: cat 2015-01.txt | node convert -c COP > test.qif

Si se quiere especificar el archivo, se debe usar la opción -f

node convert -f miarchivo.txt -c COP > test.qif
 */

var fs = require('fs');
var split = require('split');
var es = require('eventstream');
var through = require('through2');
process.stdin.setEncoding('utf-8');
var argv = require('minimist')(process.argv.slice(2));
var outputfile = argv.f;
var filtercurrency = argv.c;

//Si no hay archivo especificado usar entrada estandar
(outputfile?fs.createReadStream(outputfile,'utf-8'):(process.stdin))
	.pipe(split())
	.pipe(new obtenerTransacciones())
	.pipe(generarQifRow())
	.pipe(process.stdout);


var currencies = {
	PESOS:'COP',
	DOLARES:'USD'
}

//Retorna un stream que recibe las lineas
//y pasa al stream un objeto que tiene 
/*
  {
	moneda:'USD',
	rows:[

	]
  }
 */
function obtenerTransacciones(){

	var currency = null;
	/* para saber que tipo de registro estamos leyendo
	usamos sectionCode, posibles valores son:
	- currency: la siguiente linea nos dice la moneda
	- transactionheader
	- transaction: vamos a leer info de transacciones hasta encontrar
	*/

	var sectionCode = null; 


	return through.obj(function write(data, enc, cb){
		//console.log(data, enc)
		var parts = data.split('\t');

		if(parts.length >0 && parts[0] == 'FRANQUICIA'){
			sectionCode = 'currency'
			cb();
			return;
		}

		if(parts.length >0 && parts[0] == 'Movimientos:'){
			sectionCode = 'transactionheader'
			cb();
			
			return;
		}

		if(sectionCode == 'currency'){
			if(parts.length>2){
				currency = parts[1];
			}
			sectionCode = 'transaction';
			cb();
			
			return;
		}
		if(sectionCode == 'transactionheader'){
			//después del encabezado viene la lista de movimientos
			sectionCode = 'transaction';
			cb();
			
			return;
		}
		if(sectionCode == 'transaction'){
			if(isValidTransaction(data)){
				
				var transactionData = {

					id:parts[0],
					fecha:parts[1],
					desc:parts[2],
					orig:parts[3],
					cargos:parts[7],
					cuota:parts[8],
					currency:currencies[currency]
				}
				//Solo agregar SI esprimera cuota
				if(transactionData.cuota.indexOf('1\/') == 0){
					//Solo agregar si la currency es la especificada
					if(!filtercurrency){
						this.push(transactionData);
					}else if(filtercurrency === transactionData.currency){
						this.push(transactionData);
					}

				}

				cb();
				return;


			}else{
				//otra sección que no nos interesa
				//sectionCode = '';
				cb();
				return;
				

			}
		}
		cb();

	})
}

function isValidTransaction(line){

	var parts = line.split('\t');
	if( parts.length == 9 )
	{
		if(parts[0].trim().length == 0)
			return false;

		return true;
	}
	else{
		return false;
	}
}

//From: 2015/ENE/29
//To  : 2015/01/29
function convertirFecha(date){
	var months = {
		ENE:'01',
		FEB:'02',
		MAR:'03',
		ABR:'04',
		MAY:'05',
		JUN:'06',
		JUL:'07',
		AGO:'08',
		SEP:'09',
		OCT:'10',
		NOV:'11',
		DIC:'12',
	}
	var parts = date.split('\/');
	parts[1] = months[parts[1]];
	return 'D'+ parts.join('\/');
}

function generarQifRow(){
	return through.obj(function write(data, enc, cb){
		this.push('!Type:CCard\n');
		this.push(convertirFecha(data.fecha) + '\n');
		this.push('T'+data.orig + '\n');
		this.push('N'+data.id + '\n');
		this.push('P'+data.desc + '\n'); //Payee
		this.push('L[Expenses:Miscellaneous]' + '\n');
		this.push('^\n');
		cb();
	})
}
