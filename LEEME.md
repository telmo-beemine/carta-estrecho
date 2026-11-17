# Carta del Estrecho

La página de inicio es `index.html`. La carta interactiva, con el nuevo diseño y las pestañas de ejercicios, está en `carta/index.html`.

## Ver el proyecto

Desde esta carpeta:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre http://127.0.0.1:8000 en tu navegador. Para detener el servidor, pulsa Ctrl+C en la terminal.

Usa un servidor HTTP para probar la carta: la máscara de tierra se lee mediante canvas y requiere que las imágenes se sirvan desde el mismo origen.

## Estructura

- `index.html`: landing y accesos a las modalidades de práctica.
- `styles.css`: estilos de la landing.
- `theme.css`: colores, tipografía y variables compartidas con la carta.
- `landing.js`: pestañas de la vista ilustrativa y ejemplo interactivo.
- `img/`: imágenes de referencia de la práctica y del simulador.
- `carta/`: aplicación actualizada y sus imágenes.

## Enlaces directos

- `carta/index.html#misiones`: recorrido de 13 misiones.
- `carta/index.html#examenes`: convocatorias oficiales.
- `carta/index.html#practica`: ejercicios aleatorios y ejemplos.
- `carta/index.html#barco`: carta con el útil Barco seleccionado.

Los enlaces abren el espacio correspondiente; no inician una misión ni eliminan trazados automáticamente. El nombre del proyecto en la cabecera de la carta vuelve a la portada.

## Publicación

Es una web estática: sube el contenido de esta carpeta, conservando la estructura, a tu alojamiento. No necesita compilación ni instalación de paquetes. El ZIP de entrega contiene todos los archivos necesarios.

Inter se carga desde Google Fonts. Sin conexión se usa la tipografía del sistema. El progreso se guarda en el navegador mediante la misma clave local que la versión anterior; no se sincroniza entre dispositivos.

Proyecto educativo. Carta de enseñanza, no válida para la navegación.
