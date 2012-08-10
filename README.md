# undo.js

`undo.js` is a javascript library that helps you restore values of different DOM elements. It uses the FILE API, when you press ctrl+s it saves the content of your watched DOM element in a file. When you press ctrl+z that save in brought back to the DOM. Works great with textarea, input, and divs with `contentEditable` attr.

# Usage

```
var snippet = document.querySelector('#snippet');

undo.init({
	'type' : 'permanent',
	'size' : 5*1024*1024,
	'watch' : snippet
});
```
You initialise it passing in the type of storage permanent/temporary the amout of space you need and the DOM element to watch.
