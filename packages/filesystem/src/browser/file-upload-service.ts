import {inject, injectable} from 'inversify';
import URI from '@tartjs/core/lib/common/uri';
import {FileService} from './file-service';
import {EncodingService} from '@tartjs/core/lib/common/encoding-service';
import {BinaryBuffer} from "@tartjs/core/lib/common//buffer";


export interface FileUploadParams {
    source?: DataTransfer
    progress?: FileUploadProgressParams
    onDidUpload?: (uri: string) => void;
}

export interface FileUploadProgressParams {
    text: string
}

@injectable()
export class FileUploadService {
    static TARGET = 'target';
    static UPLOAD = 'upload';

    @inject(FileService)
    protected fileService: FileService;

    @inject(EncodingService)
    protected readonly encodingService: EncodingService;

    async upload(targetUri: string | URI, parmas: FileUploadParams = {}): Promise<void> {
        let uri = targetUri.toString();
        if (!uri.endsWith('/')) {
            uri += '/';
        }
        for (let i = 0; i < parmas.source.files.length; i++) {
            const reader = new FileReader();
            const name = parmas.source.files[i].name;
            reader.readAsArrayBuffer(parmas.source.files[i]);
            reader.onload = () => {
                const data = reader.result;
                this.fileService.writeFile(new URI(uri + name), BinaryBuffer.wrap(new Uint8Array(data as ArrayBuffer)));
            }
        }
    }
}
