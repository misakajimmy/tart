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
export interface ReadableStreamEvents<T> {
    /**
     * The 'data' event is emitted whenever the stream is
     * relinquishing ownership of a chunk of data to a consumer.
     */
    on(event: 'data', callback: (data: T) => void): void;
    /**
     * Emitted when any error occurs.
     */
    on(event: 'error', callback: (err: Error) => void): void;
    /**
     * The 'end' event is emitted when there is no more data
     * to be consumed from the stream. The 'end' event will
     * not be emitted unless the data is completely consumed.
     */
    on(event: 'end', callback: () => void): void;
}
/**
 * A interface that emulates the API shape of a node.js readable
 * stream for use in desktop and web environments.
 */
export interface ReadableStream<T> extends ReadableStreamEvents<T> {
    /**
     * Stops emitting any events until resume() is called.
     */
    pause(): void;
    /**
     * Starts emitting events again after pause() was called.
     */
    resume(): void;
    /**
     * Destroys the stream and stops emitting any event.
     */
    destroy(): void;
    /**
     * Allows to remove a listener that was previously added.
     */
    removeListener(event: string, callback: Function): void;
}
/**
 * A interface that emulates the API shape of a node.js readable
 * for use in desktop and web environments.
 */
export interface Readable<T> {
    /**
     * Read data from the underlying source. Will return
     * null to indicate that no more data can be read.
     */
    read(): T | null;
}
export declare namespace Readable {
    function fromString(value: string): Readable<string>;
    function toString(readable: Readable<string>): string;
}
/**
 * A interface that emulates the API shape of a node.js writeable
 * stream for use in desktop and web environments.
 */
export interface WriteableStream<T> extends ReadableStream<T> {
    /**
     * Writing data to the stream will trigger the on('data')
     * event listener if the stream is flowing and buffer the
     * data otherwise until the stream is flowing.
     *
     * If a `highWaterMark` is configured and writing to the
     * stream reaches this mark, a promise will be returned
     * that should be awaited on before writing more data.
     * Otherwise there is a risk of buffering a large number
     * of data chunks without consumer.
     */
    write(data: T): void | Promise<void>;
    /**
     * Signals an error to the consumer of the stream via the
     * on('error') handler if the stream is flowing.
     */
    error(error: Error): void;
    /**
     * Signals the end of the stream to the consumer. If the
     * result is not an error, will trigger the on('data') event
     * listener if the stream is flowing and buffer the data
     * otherwise until the stream is flowing.
     *
     * In case of an error, the on('error') event will be used
     * if the stream is flowing.
     */
    end(result?: T | Error): void;
}
/**
 * A stream that has a buffer already read. Returns the original stream
 * that was read as well as the chunks that got read.
 *
 * The `ended` flag indicates if the stream has been fully consumed.
 */
export interface ReadableBufferedStream<T> {
    /**
     * The original stream that is being read.
     */
    stream: ReadableStream<T>;
    /**
     * An array of chunks already read from this stream.
     */
    buffer: T[];
    /**
     * Signals if the stream has ended or not. If not, consumers
     * should continue to read from the stream until consumed.
     */
    ended: boolean;
}
export declare function isReadableStream<T>(obj: unknown): obj is ReadableStream<T>;
export declare function isReadableBufferedStream<T>(obj: unknown): obj is ReadableBufferedStream<T>;
export interface Reducer<T> {
    (data: T[]): T;
}
export interface DataTransformer<Original, Transformed> {
    (data: Original): Transformed;
}
export interface ErrorTransformer {
    (error: Error): Error;
}
export interface ITransformer<Original, Transformed> {
    data: DataTransformer<Original, Transformed>;
    error?: ErrorTransformer;
}
export declare function newWriteableStream<T>(reducer: Reducer<T>, options?: WriteableStreamOptions): WriteableStream<T>;
export interface WriteableStreamOptions {
    /**
     * The number of objects to buffer before WriteableStream#write()
     * signals back that the buffer is full. Can be used to reduce
     * the memory pressure when the stream is not flowing.
     */
    highWaterMark?: number;
}
/**
 * Helper to fully read a T readable into a T.
 */
export declare function consumeReadable<T>(readable: Readable<T>, reducer: Reducer<T>): T;
/**
 * Helper to read a T readable up to a maximum of chunks. If the limit is
 * reached, will return a readable instead to ensure all data can still
 * be read.
 */
export declare function consumeReadableWithLimit<T>(readable: Readable<T>, reducer: Reducer<T>, maxChunks: number): T | Readable<T>;
/**
 * Helper to read a T readable up to a maximum of chunks. If the limit is
 * reached, will return a readable instead to ensure all data can still
 * be read.
 */
export declare function peekReadable<T>(readable: Readable<T>, reducer: Reducer<T>, maxChunks: number): T | Readable<T>;
/**
 * Helper to fully read a T stream into a T.
 */
export declare function consumeStream<T>(stream: ReadableStream<T>, reducer: Reducer<T>): Promise<T>;
/**
 * Helper to peek up to `maxChunks` into a stream. The return type signals if
 * the stream has ended or not. If not, caller needs to add a `data` listener
 * to continue reading.
 */
export declare function peekStream<T>(stream: ReadableStream<T>, maxChunks: number): Promise<ReadableBufferedStream<T>>;
/**
 * Helper to read a T stream up to a maximum of chunks. If the limit is
 * reached, will return a stream instead to ensure all data can still
 * be read.
 */
export declare function consumeStreamWithLimit<T>(stream: ReadableStream<T>, reducer: Reducer<T>, maxChunks: number): Promise<T | ReadableStream<T>>;
/**
 * Helper to create a readable stream from an existing T.
 */
export declare function toStream<T>(t: T, reducer: Reducer<T>): ReadableStream<T>;
/**
 * Helper to convert a T into a Readable<T>.
 */
export declare function toReadable<T>(t: T): Readable<T>;
/**
 * Helper to transform a readable stream into another stream.
 */
export declare function transform<Original, Transformed>(stream: ReadableStreamEvents<Original>, transformer: ITransformer<Original, Transformed>, reducer: Reducer<Transformed>): ReadableStream<Transformed>;
