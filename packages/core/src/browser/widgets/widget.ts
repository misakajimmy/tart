import {decorate, injectable, unmanaged} from 'inversify';
import {Widget} from '@lumino/widgets';

decorate(injectable(), Widget);
decorate(unmanaged(), Widget, 0);

export * from '@lumino/widgets';
