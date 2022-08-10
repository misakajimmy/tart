import { Container, interfaces } from 'inversify';
import { FileNavigatorWidget } from './navigator-widget';
import { TreeProps } from '@tart/core';
export declare const FILE_NAVIGATOR_PROPS: TreeProps;
export declare function createFileNavigatorContainer(parent: interfaces.Container): Container;
export declare function createFileNavigatorWidget(parent: interfaces.Container): FileNavigatorWidget;
