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
import URI from '@tart/core/lib/common/uri';
import { BinaryBuffer } from '@tart/core/lib/common//buffer';
import { CancellationToken } from '@tart/core/lib/common/cancellation';
import { FileReadStreamOptions, FileSystemProviderWithOpenReadWriteCloseCapability } from './files';
import { DataTransformer, ErrorTransformer, WriteableStream } from '@tart/core/lib/common/stream';
export interface CreateReadStreamOptions extends FileReadStreamOptions {
    /**
     * The size of the buffer to use before sending to the stream.
     */
    bufferSize: number;
    /**
     * Allows to massage any possibly error that happens during reading.
     */
    errorTransformer?: ErrorTransformer;
}
/**
 * A helper to read a file from a provider with open/read/close capability into a stream.
 */
export declare function readFileIntoStream<T>(provider: FileSystemProviderWithOpenReadWriteCloseCapability, resource: URI, target: WriteableStream<T>, transformer: DataTransformer<BinaryBuffer, T>, options: CreateReadStreamOptions, token: CancellationToken): Promise<void>;
