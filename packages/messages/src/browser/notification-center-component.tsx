import React from 'react';
import {MessageManager, NotificationUpdateEvent} from './message-manager';
import {DisposableCollection} from '@tartjs/core/lib/common';
import {nls} from '@tartjs/core/lib/common/nls';
import {codicon} from '@tartjs/core';
import {NotificationComponent} from './notification-component';
import PerfectScrollbar from 'react-perfect-scrollbar';

export interface NotificationCenterComponentProps {
  readonly manager: MessageManager;
}

type NotificationCenterComponentState = Pick<NotificationUpdateEvent, Exclude<keyof NotificationUpdateEvent, 'toasts'>>;

export class NotificationCenterComponent extends React.Component<NotificationCenterComponentProps, NotificationCenterComponentState> {

  constructor(props: NotificationCenterComponentProps) {
    super(props);
    this.state = {
      notifications: [],
      visibilityState: 'hidden'
    };
  }

  protected readonly toDisposeOnUnmount = new DisposableCollection();

  async componentDidMount(): Promise<void> {
    this.toDisposeOnUnmount.push(
      this.props.manager.onUpdated(({notifications, visibilityState}) => {
        this.setState({
          notifications: notifications,
          visibilityState
        });
      })
    );
  }

  componentWillUnmount(): void {
    this.toDisposeOnUnmount.dispose();
  }

  render(): React.ReactNode {
    const empty = this.state.notifications.length === 0;
    const title = empty
      ? nls.localizeByDefault('No New Notifications')
      : nls.localizeByDefault('Notifications');
    return (
      <div
        className={`tart-notifications-container tart-notification-center ${this.state.visibilityState === 'center' ? 'open' : 'closed'}`}>
        <div className='tart-notification-center-header'>
          <div className='tart-notification-center-header-title'>{title}</div>
          <div className='tart-notification-center-header-actions'>
            <ul className='tart-notification-actions'>
              <li className={codicon('clear-all', true)} title={nls.localizeByDefault('Clear All Notifications')}
                  onClick={this.onClearAll}/>
              <li className={codicon('chevron-down', true)} title={nls.localizeByDefault('Hide Notifications')}
                  onClick={this.onHide}/>
            </ul>
          </div>
        </div>
        <PerfectScrollbar className='tart-notification-list-scroll-container'>
          <div className='tart-notification-list'>
            {this.state.notifications.map(notification =>
              <NotificationComponent key={notification.messageId} notification={notification}
                                     manager={this.props.manager}/>
            )}
          </div>
        </PerfectScrollbar>
      </div>
    );
  }

  protected onHide = () => {
    this.props.manager.hideCenter();
  };

  protected onClearAll = () => {
    this.props.manager.clearAll();
  };

}
