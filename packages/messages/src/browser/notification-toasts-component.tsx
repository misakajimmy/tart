import React from "react";
import {DisposableCollection} from '@tartjs/core/lib/common';
import {CorePreferences} from '@tartjs/core';
import {MessageManager, NotificationUpdateEvent} from './message-manager';
import {NotificationComponent} from './notification-component';

export interface NotificationToastsComponentProps {
  readonly manager: MessageManager;
  readonly corePreferences: CorePreferences;
}

type NotificationToastsComponentState = Pick<NotificationUpdateEvent, Exclude<keyof NotificationUpdateEvent, 'notifications'>>;

export class NotificationToastsComponent extends React.Component<NotificationToastsComponentProps, NotificationToastsComponentState> {

  constructor(props: NotificationToastsComponentProps) {
    super(props);
    this.state = {
      toasts: [],
      visibilityState: 'hidden'
    };
  }

  protected readonly toDisposeOnUnmount = new DisposableCollection();

  async componentDidMount(): Promise<void> {
    this.toDisposeOnUnmount.push(
      this.props.manager.onUpdated(({toasts, visibilityState}) => {
        visibilityState = this.props.corePreferences['workbench.silentNotifications'] ? 'hidden' : visibilityState;
        this.setState({
          toasts: toasts.slice(-3),
          visibilityState
        });
      })
    );
  }

  componentWillUnmount(): void {
    this.toDisposeOnUnmount.dispose();
  }

  render(): React.ReactNode {
    return (
      <div
        className={`tart-notifications-container tart-notification-toasts ${this.state.visibilityState === 'toasts' ? 'open' : 'closed'}`}>
        <div className='tart-notification-list'>
          {
            this.state.toasts.map(notification =>
              <NotificationComponent
                key={notification.messageId}
                notification={notification}
                manager={this.props.manager}
              />
            )
          }
        </div>
      </div>
    );
  }

}
