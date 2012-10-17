# undo.js

`undo.js` is a javascript library that helps you restore values of different DOM elements. It uses the FILE API; when you press `ctrl+s` it saves the content of your watched DOM element in a file. When you press ctrl+z that save is brought back to the DOM. Works great with textarea, input, and divs with `contentEditable` attr.

# Usage

```
var snippet = document.querySelector('#snippet');

undo.init({
	'type' : 'permanent', // or temporary
	'size' : 5*1024*1024, // size
	'watch' : snippet // single element or a collection with document.querySelectorAll('.className');
});
```