var undo = (function () {

	var filesys;
	window.URL = window.URL || window.webkitURL;
	var watch;
	var filelist = {};

	var init = function (options) {
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
		if(options.type === 'temporary') {
			window.requestFileSystem(TEMPORARY, options.size, success, error);
		} else {
			window.webkitStorageInfo.requestQuota(PERSISTENT, options.size, function(grantedBytes) {
				window.requestFileSystem(PERSISTENT, grantedBytes, success, error);
			}, function(e) {
				console.log('Error', e);
			});
		}
		watch = options.watch;
		[].forEach.call(options.watch, function(el){
			el.addEventListener('keydown', function(e) {
				if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
					e.preventDefault();
					save(this);
				}
			}, false);
			el.addEventListener('keydown', function(e) {
				if (e.keyCode === 90 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
					undo(this);
				}
			}, false);
		});
	};

	var undo = function (el) {
		if(filelist[el.id] && filelist[el.id].length) {
			var value = filelist[el.id][0];
			filelist[el.id] = filelist[el.id].slice(1, filelist.length);
			read(value, el);
		} else {
			console.log('No history to revert to');
		}
	};

	var createDir = function (rootDir, folders) {
		rootDir.getDirectory(folders[0], {create: true}, function(dirEntry) {
			if (folders.length) {
				createDir(dirEntry, folders.slice(1));
			}
		}, error);
	};

	var save = function(el, content, file, type) {

		if(!content) {
			if(el.innerHTML) {
				content = el.innerHTML;
			} else {
				content = el.value;
			}
		}
		
		createDir(filesys.root, [el.id]);

		file = file || el.id + '/undo_'+ Date.now() +'.txt';
		type = type || {type: 'text/plain'};
		
		filesys.root.getFile(file, {create: true}, function(fileEntry) {

			// Create a FileWriter object for our FileEntry (log.txt).
			fileEntry.createWriter(function(fileWriter) {

			fileWriter.onwriteend = function() {
				if(!filelist[el.id]) {
					filelist[el.id] = [];
				}
				filelist[el.id].push(file);
			};

			fileWriter.onerror = function(e) {
				console.log('Write failed: ' + e.toString());
			};

			// Create a new Blob and write it to log.txt.
			var blob = new Blob([content], type);
			fileWriter.write(blob);

			}, error);

		}, error);
	};

	var iterateFolder = function (doc) {

			filesys.root.getDirectory(doc, {}, function(dirEntry){
			var dirReader = dirEntry.createReader();
			dirReader.readEntries(function(entries) {
				for(var i = 0; i < entries.length; i++) {
					var entry = entries[i];
					if (entry.isDirectory){
						console.log('Directory: ' + entry.fullPath);
					}
					else if (entry.isFile){
						var folder = doc.slice(1, doc.length);
						if(!filelist[folder]) {
							filelist[folder] = [];
						}
						filelist[folder].push(entry.fullPath);
					}
				}
			}, error);
		}, error);
	};

	var load = function (el) {
		var dirReader = filesys.root.createReader();

		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
			dirReader.readEntries (function(results) {

				if (!results.length) {
					//console.log(results);
				} else {
					for (var i = 0; i < results.length; i++) {
						iterateFolder(results[i].fullPath);
					}
					readEntries();
				}
			}, error);
		};

		readEntries(); // Start reading dirs.

	};

	var removeOne = function (file) {
		filesys.root.getFile(file, {create: false}, function(fileEntry) {
			fileEntry.remove(function() {
				console.log('File removed.');
			}, error);
		}, error);
	};

	var clear = function () {
		for(var i in filelist) {
			filelist[i].forEach(function(filePath){
				filesys.root.getFile(filePath, {create: false}, function(fileEntry) {
					fileEntry.remove(function() {
						console.log('File removed.');
					}, error);
				}, error);
			});
		}
	};

	var read = function (file, el) {
		if(!file) {
			console.error('No file selected');
			return;
		}
		
		filesys.root.getFile(file, {}, function(fileEntry) {
			fileEntry.file(function(file) {
			var reader = new FileReader();
			reader.onloadend = function() {
				if (el.innerHTML) {
					el.innerHTML = this.result;
				} else {
					el.value = this.result;
				}
			};

			reader.readAsText(file);
			}, error);

		}, error);
	};

	var success = function (fs) {
		filesys = fs;
		[].forEach.call(watch, function (el) {
			load(el);
		});
	};

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
		}

		console.log('Error: ' + msg);
	};

	return {
		init: init,
		save: save,
		clear: clear
	};

})();