import URI from '@tart/core/lib/common/uri';
import { FileService } from './file-service';
import { EncodingService } from '@tart/core/lib/common/encoding-service';
export interface FileUploadParams {
    source?: DataTransfer;
    progress?: FileUploadProgressParams;
    onDidUpload?: (uri: string) => void;
}
export interface FileUploadProgressParams {
    text: string;
}
export declare class FileUploadService {
    static TARGET: string;
    static UPLOAD: string;
    protected fileService: FileService;
    protected readonly encodingService: EncodingService;
    upload(targetUri: string | URI, parmas?: FileUploadParams): Promise<void>;
}
