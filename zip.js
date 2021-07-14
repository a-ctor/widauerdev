class BinaryWriter {

    constructor(buffer, offset, length) {
        this.data = new DataView(buffer, offset, length);
        this.position = 0;
    }

    writeInt16(value, littleEndian) {
        this.data.setInt16(this.position, value, littleEndian);
        this.position += 2;
    }

    writeInt32(value, littleEndian) {
        this.data.setInt32(this.position, value, littleEndian);
        this.position += 4;
    }

    writeData(data) {
        const window = new Uint8Array(this.data.buffer, this.data.byteOffset + this.position, data.length);
        for (let i = 0; i < data.length; i++)
            window[i] = data[i];
        this.position += data.length;
    }
}

const crc = new Crc32();

function getEntryRecordSize(entry) {
    return 30 + entry.nameData.length + entry.fileData.length;
}

function writeEntryRecord(entry, writer) {
    writer.writeInt32(0x504B0304); // Signature
    writer.writeInt32(0x0A000000); // Version and Flags
    writer.writeInt16(0x0000); // Compression type
    writer.writeInt16(0x0000); // Time
    writer.writeInt16(0x0000); // Date
    writer.writeInt32(crc.calculate(entry.fileData), true); // CRC32
    writer.writeInt32(entry.fileData.length, true); // Compressed file size
    writer.writeInt32(entry.fileData.length, true); // Uncompressed file size
    writer.writeInt16(entry.nameData.length, true); // File name length
    writer.writeInt16(0); // Extra field length
    writer.writeData(entry.nameData);
    writer.writeData(entry.fileData);
}

function getCentralDirectoryEntrySize(entry) {
    return 46 + entry.nameData.length;
}

function writeCentralDirectoryEntry(entry, writer) {
    writer.writeInt32(0x504b0102); // Signature
    writer.writeInt16(0x3F00); // Version made by
    writer.writeInt16(0x1000); // Version to extract
    writer.writeInt16(0x0000); // Flags
    writer.writeInt16(0x0000); // Compression type
    writer.writeInt16(0x0000); // Time
    writer.writeInt16(0x0000); // Date
    writer.writeInt32(crc.calculate(entry.fileData), true); // CRC32
    writer.writeInt32(entry.fileData.length, true); // Compressed file size
    writer.writeInt32(entry.fileData.length, true); // Uncompressed file size
    writer.writeInt16(entry.nameData.length, true); // File name length
    writer.writeInt16(0); // Extra field length
    writer.writeInt16(0); // Field comment length
    writer.writeInt16(0); // Disk number
    writer.writeInt16(0); // Internal attributes
    writer.writeInt32(32, true); // External attributes
    writer.writeInt32(entry.dataPosition, true); // Data offset
    writer.writeData(entry.nameData);
}

function getEndLocatorSize() {
    return 22;
}

function writeEndLocator(writer, entryCount, directoryOffset, directorySize) {
    writer.writeInt32(0x504b0506); // Signature
    writer.writeInt16(0); // Disk number
    writer.writeInt16(0); // Start disk number
    writer.writeInt16(entryCount, true); // Entries on disk
    writer.writeInt16(entryCount, true); // Entries in directory
    writer.writeInt32(directorySize, true); // Directory size
    writer.writeInt32(directoryOffset, true); // Directory offset
    writer.writeInt16(0); // Comment length
}

function createZip(files) {
    let totalSize = 0;
    for (let file of files) {
        totalSize += getEntryRecordSize(file);
        totalSize += getCentralDirectoryEntrySize(file);
    }
    totalSize += getEndLocatorSize();

    const result = new ArrayBuffer(totalSize);

    
    let position = 0;
    
    // Write the records
    for (let file of files) {
        const entryRecordSize = getEntryRecordSize(file);
        file.dataPosition = position;

        const writer = new BinaryWriter(result, position, entryRecordSize);
        writeEntryRecord(file, writer);
        position += entryRecordSize;
    }
    const centralDirectoryStart = position;

    // Write the directory
    for (let file of files) {
        const centralDirectoryEntrySize = getCentralDirectoryEntrySize(file);

        const writer = new BinaryWriter(result, position, centralDirectoryEntrySize);
        writeCentralDirectoryEntry(file, writer);
        position += centralDirectoryEntrySize;
    }

    // Write the endlocator
    {
        const writer = new BinaryWriter(result, position, getEndLocatorSize());
        writeEndLocator(writer, files.length, centralDirectoryStart, position - centralDirectoryStart);
    }

    console.info(new Uint8Array(result));
    return result;
}