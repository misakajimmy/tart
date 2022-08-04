/********************************************************************************
 * Copyright (C) 2020 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { Buffer } from 'safer-buffer';
import { BinaryBuffer, BinaryBufferReadable, BinaryBufferReadableStream } from './buffer';
import { UTF16be, UTF16le, UTF8_with_bom } from './encodings';
import { Readable, ReadableStream } from './stream';
export interface ResourceEncoding {
    encoding: string;
    hasBOM: boolean;
}
export interface DetectedEncoding {
    encoding?: string;
    seemsBinary?: boolean;
}
export interface DecodeStreamOptions {
    guessEncoding?: boolean;
    minBytesRequiredForDetection?: number;
    overwriteEncoding(detectedEncoding: string | undefined): Promise<string>;
}
export interface DecodeStreamResult {
    stream: ReadableStream<string>;
    detected: DetectedEncoding;
}
export declare class EncodingService {
    encode(value: string, options?: ResourceEncoding): BinaryBuffer;
    decode(value: BinaryBuffer, encoding?: string): string;
    exists(encoding: string): boolean;
    toIconvEncoding(encoding?: string): string;
    toResourceEncoding(encoding: string, options: {
        overwriteEncoding?: boolean;
        read: (length: number) => Promise<Uint8Array>;
    }): Promise<ResourceEncoding>;
    detectEncoding(data: BinaryBuffer, autoGuessEncoding?: boolean): Promise<DetectedEncoding>;
    decodeStream(source: BinaryBufferReadableStream, options: DecodeStreamOptions): Promise<DecodeStreamResult>;
    encodeStream(value: string | Readable<string>, options?: ResourceEncoding): Promise<BinaryBuffer | BinaryBufferReadable>;
    encodeStream(value?: string | Readable<string>, options?: ResourceEncoding): Promise<BinaryBuffer | BinaryBufferReadable | undefined>;
    protected detectEncodingByBOMFromBuffer(buffer: Buffer, bytesRead: number): typeof UTF8_with_bom | typeof UTF16le | typeof UTF16be | undefined;
    protected guessEncodingByBuffer(buffer: Buffer): Promise<string | undefined>;
}
