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
import * as streams from './stream';
export declare class BinaryBuffer {
    readonly buffer: Uint8Array;
    readonly byteLength: number;
    private constructor();
    static alloc(byteLength: number): BinaryBuffer;
    static wrap(actual: Uint8Array): BinaryBuffer;
    static fromString(source: string): BinaryBuffer;
    static concat(buffers: BinaryBuffer[], totalLength?: number): BinaryBuffer;
    toString(): string;
    slice(start?: number, end?: number): BinaryBuffer;
    set(array: BinaryBuffer, offset?: number): void;
    set(array: Uint8Array, offset?: number): void;
    readUInt32BE(offset: number): number;
    writeUInt32BE(value: number, offset: number): void;
    readUInt32LE(offset: number): number;
    writeUInt32LE(value: number, offset: number): void;
    readUInt8(offset: number): number;
    writeUInt8(value: number, offset: number): void;
}
export interface BinaryBufferReadable extends streams.Readable<BinaryBuffer> {
}
export declare namespace BinaryBufferReadable {
    function toBuffer(readable: BinaryBufferReadable): BinaryBuffer;
    function fromBuffer(buffer: BinaryBuffer): BinaryBufferReadable;
    function fromReadable(readable: streams.Readable<string>): BinaryBufferReadable;
}
export interface BinaryBufferReadableStream extends streams.ReadableStream<BinaryBuffer> {
}
export declare namespace BinaryBufferReadableStream {
    function toBuffer(stream: BinaryBufferReadableStream): Promise<BinaryBuffer>;
    function fromBuffer(buffer: BinaryBuffer): BinaryBufferReadableStream;
}
export interface BinaryBufferReadableBufferedStream extends streams.ReadableBufferedStream<BinaryBuffer> {
}
export declare namespace BinaryBufferReadableBufferedStream {
    function toBuffer(bufferedStream: streams.ReadableBufferedStream<BinaryBuffer>): Promise<BinaryBuffer>;
}
export interface BinaryBufferWriteableStream extends streams.WriteableStream<BinaryBuffer> {
}
export declare namespace BinaryBufferWriteableStream {
    function create(options?: streams.WriteableStreamOptions): BinaryBufferWriteableStream;
}
