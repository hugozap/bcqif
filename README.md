# Que es ?

Un script simple que permite cargar información bancaria de Bancolombia a programas como [GnuCash](http://www.gnucash.org/)
con el fin de tomar decisiones financieras, clasificar gastos, ver reportes. Para ello este script
genera archivos tipo .QIF que pueden ser importados por estas herramientas.

** Todo esto es necesario porque los bancos Colombianos tienen reportes muy pobres **

Nota:

Aunque Bancolombia tiene la opción de exportar a QIF, en mis pruebas estos archivos tienen problemas y no funcionaron al intentar cargarlos a GnuCash

## Como usarlo?

* Instale NodeJS en su sistema
* Descargue el archivo txt desde la sucursal virtual,
* Con el siguiente comando puede generar el archivo QIF , la opción -c permite especificar COP o USD para que el archivo QIF solo tenga registros de la moneda especificada.

  node convert -f miarchivo.txt -c COP > test.qif
  
  
* ( solo unix ) Si quiere usar pipes puede usar:
  
USO: cat 2015-01.txt | node convert -c COP > test.qif

Si se quiere especificar el archivo, se debe usar la opción -f

