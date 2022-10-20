import React from 'react';
import {MessageManager, Notification} from './message-manager';
import {codicon} from '@tartjs/core';
import {nls} from '@tartjs/core/lib/common/nls';
import DOMPurify from 'dompurify';

export interface NotificationComponentProps {
  readonly manager: MessageManager;
  readonly notification: Notification;
}

export class NotificationComponent extends React.Component<NotificationComponentProps> {

  constructor(props: NotificationComponentProps) {
    super(props);
    this.state = {};
  }

  protected onClear = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      const messageId = event.target.dataset.messageId;
      if (messageId) {
        this.props.manager.clear(messageId);
      }
    }
  };

  protected onToggleExpansion = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      const messageId = event.target.dataset.messageId;
      if (messageId) {
        this.props.manager.toggleExpansion(messageId);
      }
    }
  };

  protected onAction = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement) {
      const messageId = event.target.dataset.messageId;
      const action = event.target.dataset.action;
      if (messageId && action) {
        this.props.manager.accept(messageId, action);
      }
    }
  };

  protected onMessageClick = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLAnchorElement) {
      event.stopPropagation();
      event.preventDefault();
      const link = event.target.href;
      this.props.manager.openLink(link);
    }
  };

  render(): React.ReactNode {
    const {messageId, message, type, progress, collapsed, expandable, source, actions} = this.props.notification;
    const isProgress = typeof progress === 'number';
    return (<div key={messageId} className='tart-notification-list-item'>
      <div className={`tart-notification-list-item-content ${collapsed ? 'collapsed' : ''}`}>
        <div className='tart-notification-list-item-content-main'>
          <div className={`tart-notification-icon ${codicon(type)} ${type}`}/>
          <div className='tart-notification-message'>
            <span
              dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(message)}} // eslint-disable-line react/no-danger
              onClick={this.onMessageClick}
            />
          </div>
          <ul className='tart-notification-actions'>
            {expandable && (
              <li className={codicon('chevron-down') + collapsed ? ' expand' : ' collapse'}
                  title={collapsed ? 'Expand' : 'Collapse'}
                  data-message-id={messageId} onClick={this.onToggleExpansion}/>
            )}
            {!isProgress && (
              <li className={codicon('close', true)} title={nls.localizeByDefault('Clear')} data-message-id={messageId}
                  onClick={this.onClear}/>)}
          </ul>
        </div>
        {(source || !!actions.length) && (
          <div className='tart-notification-list-item-content-bottom'>
            <div className='tart-notification-source'>
              {source && (<span>{source}</span>)}
            </div>
            <div className='tart-notification-buttons'>
              {actions && actions.map((action, index) => (
                <button key={messageId + `-action-${index}`} className='tart-button'
                        data-message-id={messageId} data-action={action}
                        onClick={this.onAction}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {
        isProgress && (
          <div className='tart-notification-item-progress'>
            <div className='tart-notification-item-progressbar' style={{width: `${progress}%`}}/>
          </div>
        )
      }
    </div>);
  }
}
