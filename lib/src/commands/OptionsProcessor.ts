import * as _ from 'lodash';

import { Store } from '../components/Store';
import { UniqueIdProvider } from '../adapters/UniqueIdProvider';
import { ColorService } from '../adapters/ColorService';
import { AssetService } from '../adapters/AssetResolver';
import { Options } from '../interfaces/Options';

export class OptionsProcessor {
  constructor(
    private store: Store,
    private uniqueIdProvider: UniqueIdProvider,
    private colorService: ColorService,
    private assetService: AssetService,
  ) {}

  public processOptions(options: Options, componentId?: string) {
    this.processObject(options, componentId);
  }

  private processObject(objectToProcess: object, componentId?: string) {
    _.forEach(objectToProcess, (value, key) => {
      this.processColor(key, value, objectToProcess);

      if (!value) {
        return;
      }

      this.processProps(key, value, objectToProcess, componentId);
      this.processComponent(key, value, objectToProcess);
      this.processImage(key, value, objectToProcess);
      this.processButtonsPassProps(key, value);

      if (!_.isEqual(key, 'passProps') && (_.isObject(value) || _.isArray(value))) {
        this.processObject(value);
      }
    });
  }

  private processColor(key: string, value: any, options: Record<string, any>) {
    if (_.isEqual(key, 'color') || _.endsWith(key, 'Color')) {
      options[key] = value === null ? 'NoColor' : this.colorService.toNativeColor(value);
    }
  }

  private processImage(key: string, value: any, options: Record<string, any>) {
    if (
      _.isEqual(key, 'icon') ||
      _.isEqual(key, 'image') ||
      _.endsWith(key, 'Icon') ||
      _.endsWith(key, 'Image')
    ) {
      options[key] = this.assetService.resolveFromRequire(value);
    }
  }

  private processButtonsPassProps(key: string, value: any) {
    if (_.endsWith(key, 'Buttons')) {
      _.forEach(value, (button) => {
        if (button.passProps && button.id) {
          this.store.setPropsForId(button.id, button.passProps);
          button.passProps = undefined;
        }
      });
    }
  }

  private processComponent(key: string, value: any, options: Record<string, any>) {
    if (_.isEqual(key, 'component')) {
      value.componentId = value.id ? value.id : this.uniqueIdProvider.generate('CustomComponent');
      if (value.passProps) {
        this.store.setPropsForId(value.componentId, value.passProps);
      }
      options[key].passProps = undefined;
    }
  }

  private processProps(key: string, value: any, options: Record<string, any>, componentId?: string) {
    if (key === 'passProps' && componentId && value) {
      this.store.setPropsForId(componentId, value);
      options[key] = undefined;
    }
  }
}
