import URI from '@tart/core/lib/common/uri';

export interface LocationService {
    location: URI | undefined;

    drives(): Promise<URI[]>;
}
