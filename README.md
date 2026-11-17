# Carta del Estrecho · Beta

Práctica interactiva de navegación sobre la carta L105 para preparar Patrón de Yate.

**Abrir la beta:** https://telmo-beemine.github.io/carta-estrecho/

## Qué incluye

- 13 misiones guiadas, con pistas y comprobación de los pasos.
- Preguntas de dos convocatorias oficiales de 2026.
- Ejercicios aleatorios y ejemplos para practicar por temas.
- Útiles de carta, calculadoras y un barco con viento y corriente.

La beta guarda el progreso en el navegador de cada persona. No requiere registro ni sincroniza datos entre dispositivos.

## Probar en local

Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre http://127.0.0.1:8000. La carta utiliza canvas y debe probarse desde un servidor HTTP.

## Publicación automática

GitHub Pages publica la raíz de la rama `main`. Al subir nuevos commits a esta rama, GitHub vuelve a desplegar la web. No hace falta instalar dependencias ni ejecutar una compilación.

- `index.html`: landing.
- `carta/`: carta interactiva y sus imágenes.
- `theme.css`: variables visuales compartidas.
- `styles.css` y `landing.js`: diseño e interacciones de la portada.
- `img/`: imágenes de la portada.

## Reportar un problema

Abre un [issue](https://github.com/telmo-beemine/carta-estrecho/issues) indicando el navegador, los pasos para reproducir el problema y, si es posible, una captura sin datos personales.

Consulta [LEEME.md](LEEME.md) para más información sobre la estructura y los enlaces directos.

Proyecto educativo. Carta de enseñanza, no válida para la navegación.
