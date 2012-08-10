var undo = (function () {

	var filesys;
	window.URL = window.URL || window.webkitURL;
	var watch;
	var filelist = [];

	var init = function (options) {
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		if(options.type === 'temporary') {
			window.requestFileSystem(options.type, options.size, success, error);
		} else {
			window.webkitStorageInfo.requestQuota(PERSISTENT, options.size, function(grantedBytes) {
				window.requestFileSystem(PERSISTENT, grantedBytes, success, error);
			}, function(e) {
				console.log('Error', e);
			});
		}
		watch = options.watch;
		document.addEventListener("keydown", function(e) {
			if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
				e.preventDefault();
				save();
			}
		}, false);
		document.addEventListener("keydown", function(e) {
			if (e.keyCode == 90 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
				undo();
			}
		}, false);
	};

	var undo = function () {
		if(filelist.length) {
			console.log(filelist);
			prev = filelist.pop();
			read(prev);
		} else {
			console.error('no history');
		}
	}

	var save = function(content, file, type) {

		if(!content) {
			if(watch.nodeName.toLowerCase() !== 'div') {
				content = watch.value;
			} else {
				content = watch.innerHTML;
			}

			console.log(content);
		}

		var file = file || 'undo_'+ Date.now() +'.txt';
		var type = type || {type: 'text/plain'};
	
		filesys.root.getFile(file, {create: true}, function(fileEntry) {

			// Create a FileWriter object for our FileEntry (log.txt).
			fileEntry.createWriter(function(fileWriter) {

			fileWriter.onwriteend = function(e) {
				filelist.push(file);
			};

			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};

			// Create a new Blob and write it to log.txt.
			var blob = new Blob([content], type);
			fileWriter.write(blob);

			}, error);

		}, error);
	}

	var load = function () {
		var dirReader = filesys.root.createReader();
		var entries = [];

		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (!results.length) {
					//console.log(results);
				} else {
					for (var i = 0; i < results.length; i++) {
						filelist.push(results[i].fullPath);
					};
					readEntries();
				}
			}, error);
		};

		readEntries(); // Start reading dirs.

	}

	var removeOne = function (file) {
		filesys.root.getFile(file, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				console.log('File removed.');
			}, error);
		}, error);
	}

	var clear = function () {
		
		var dirReader = filesys.root.createReader();
		var entries = [];

		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
			dirReader.readEntries (function(results) {
				if (!results.length) {
					//console.log(results);
				} else {
					for (var i = 0; i < results.length; i++) {
						filesys.root.getFile(results[i].fullPath, {create: false}, function(fileEntry) {
							fileEntry.remove(function() {
								console.log('File removed.');
							}, error);
						}, error);
					};
					readEntries();
				}
			}, error);
		};

		readEntries(); // Start reading dirs.
	}

	var read = function (file) {
		if(!file) {
			console.error('No file selected');
			return;
		}
		console.log(file);
		filesys.root.getFile(file, {}, function(fileEntry) {
			fileEntry.file(function(file) {
			var reader = new FileReader();
			reader.onloadend = function(e) {
				if (watch.nodeName.toLowerCase() === 'div') {
					watch.innerHTML = this.result;
				} else {
					watch.value = this.result;
				}
			};

			reader.readAsText(file);
			}, error);

		}, error);
	}

	var success = function (fs) {
		filesys = fs;
		load();
	}

	var error = function (e) {
		var msg = '';

		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
				msg = 'QUOTA_EXCEEDED_ERR';
			break;
				case FileError.NOT_FOUND_ERR:
				msg = 'NOT_FOUND_ERR';
			break;
				case FileError.SECURITY_ERR:
				msg = 'SECURITY_ERR';
			break;
				case FileError.INVALID_MODIFICATION_ERR:
				msg = 'INVALID_MODIFICATION_ERR';
			break;
				case FileError.INVALID_STATE_ERR:
				msg = 'INVALID_STATE_ERR';
			break;
			default:
				msg = 'Unknown Error';
			break;
		};

		console.log('Error: ' + msg);
	}

	return {
		init: init,
		save: save,
		clear: clear
	}

})();