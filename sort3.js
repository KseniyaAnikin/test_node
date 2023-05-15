const fs = require('fs');
const nReadlines = require('n-readlines');
const { v4: uuidv4 } = require('uuid');

const fileName = "big.txt";							// Создаем входной файл function createBigFile стр197(для проверки)
const fileNameOut = "big_sorted.txt";		// Выходной файл, результат
const tempDir = "temp";									// Название временной директории
const memoryLimit = 10*1024*1024;		    // размер памяти в байтах, для проверки работы взяла 10Мб (для задачи 500мб)

let arrChunks = [];
let bufferBreak = Buffer.from('\n', 'latin1');

// Создаем временные файлы

function createTempFiles(){
	let mainReader = new nReadlines("./" + fileName);
	let line;
	let lineCounter = 0;
	let chunksCounter = 0;
	let chunk = {
		arr: [],
		sz: 0,
	}

	while(true){
		line = mainReader.next();
		
		if(line){
			chunk.sz += line.length;
			chunk.arr.push(line);
			lineCounter++;
		}
		
		if(chunk.sz >= memoryLimit || !line){
			console.log("BEGIN SORT " + chunksCounter);
		
			chunk.arr.sort((a, b) => {return Buffer.compare(a, b)});

			console.log("END SORT " + chunksCounter)
			
			let fileNameChunk = "./" + tempDir + "/chunk_" + chunksCounter + ".txt";
			let file = fs.openSync(fileNameChunk, "a");
			
			console.log("WRITE CHUNK TO FILE " + chunksCounter);
			
			for(let i = 0; i < chunk.arr.length; i++){
				fs.writeSync(file, chunk.arr[i]);
				fs.writeSync(file, bufferBreak);
			}
			
			fs.closeSync(file);
			
			chunksCounter++;
			lineCounter = 0;

			delete chunk.arr;
			
			chunk = {
				arr: [],
				sz: 0,
			}
			
			arrChunks.push({
				fileReader: new nReadlines(fileNameChunk),
				currentLine: null,
				count: 0,
			})
		}
		
		if(!line) break;
	}
	
	try {
		mainReader.close()
	}
	catch(e) {}
}

// Удаление временных файлов

function deleteTempFiles(){
	const arrFiles = fs.readdirSync('./' + tempDir)
    .filter((file) => {
    	return file.indexOf("chunk_") == 0;
    })
    
  console.log("DELET FILES: " + arrFiles)
    
	arrFiles.forEach((file) => {
		try {
			fs.unlinkSync('./' + tempDir + "/" + file)
		} catch(e) {}
	});
}

// Ищем наименьшую строку из всех файлов
//читаем построчно 

function findMinLine(){
	let minStringChunkIndex = -1;
	let arrIndexesToDelete = [];

	for(let i = arrChunks.length - 1; i >= 0; i--){
		if(!arrChunks[i].currentLine){
			arrChunks[i].currentLine = arrChunks[i].fileReader.next();
			
			// Больше нет строк в файле, закрываем стрим чтения и удаляем чанк
			
			if(!arrChunks[i].currentLine){
				try {
					arrChunks[i].fileReader.close();
				} catch(e) {}
				
				console.log("DELETE", i, arrChunks[i].count);

				arrIndexesToDelete.push(i);
				continue;
			}

			arrChunks[i].count += arrChunks[i].currentLine.length;
		}
		
		if(minStringChunkIndex < 0) minStringChunkIndex = i;
		else{
			if(Buffer.compare(arrChunks[i].currentLine, arrChunks[minStringChunkIndex].currentLine) == -1){
				minStringChunkIndex = i;
			}
		}
	}
	
	//нашли номер чанка в массиве с минимальной строкой
	
	let minLine = null;

	if(minStringChunkIndex >= 0){
		minLine = arrChunks[minStringChunkIndex].currentLine;
		arrChunks[minStringChunkIndex].currentLine = null;
	}
	
	// удаляем чанки, у которых файл закончился

	arrIndexesToDelete.sort().reverse().forEach(index => {
		arrChunks.splice(index, 1);
	})

	return minLine;
}

// Основная функция создания результирующего файла

function makeBigFileSorted(){
	console.log("------ Begin sorting big file! -----")

	try {
		fs.unlinkSync("./" + fileNameOut)
	} catch(e) {}

	let file = fs.openSync("./" + fileNameOut, "a");
	
	while(true){
		let minLine = findMinLine();
		if(minLine === null) break;
		
		try{
			fs.writeSync(file, minLine);
			fs.writeSync(file, bufferBreak);
		}
		catch(e) {
			console.log("ERR WRITE", index, arrChunks.length)
		}
	}

	fs.closeSync(file);
	
	console.log("COMPLETED!");
}

// Создать большой файл с рандомными строками

function createBigFile(fileName, count){
	try {
		fs.unlinkSync("./" + fileName)
	} catch(e) {}

	var file = fs.createWriteStream("./" + fileName, {flags: 'a'});
	
	for(let i = 0; i < count; i++){
		file.write(uuidv4() + "\n");
	}
	
	console.log("BIG FILE CREATED!")
}

/************************************************************************/


// createBigFile("big.txt", 1000000);

deleteTempFiles();
createTempFiles();
makeBigFileSorted();
deleteTempFiles();



















