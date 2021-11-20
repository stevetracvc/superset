/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
/* eslint-env browser */
import React from 'react';
import { Radio } from 'src/components/Radio';
import { RadioChangeEvent, Input } from 'src/common/components';
// import { Dropdown } from 'src/common/components';
import Button from 'src/components/Button';
import {
  t,
  // JsonResponse, SupersetClient
} from '@superset-ui/core';
import { getShortUrl } from 'src/utils/urlUtils';

import ModalTrigger from 'src/components/ModalTrigger';

import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
// import Checkbox from 'src/components/Checkbox';
const SAVE_TYPE_OVERWRITE = 'overwriteFilter';
const SAVE_TYPE_NEWFILTER = 'newFilter';

// for localStorage
const LS_KEY = 'ls_filter_sets';

type SaveType = typeof SAVE_TYPE_OVERWRITE | typeof SAVE_TYPE_NEWFILTER;

type SaveFilterModalProps = {
  addSuccessToast: (arg: string) => void;
  addDangerToast: (arg: string) => void;
  userId: number;
  filterTitle: string;
  dashboardTitle: string;
  dashboardId: number;
  saveType: SaveType;
  triggerNode: JSX.Element;
  onSave: (
    data: any,
    id: number | string,
    filterTitle: string,
    saveType: SaveType,
  ) => void;
  canOverwrite: boolean;
  lastModifiedTime: number;
};

type SaveFilterModalState = {
  saveType: SaveType;
  newFilterTitle: string;
  // shortUrl: string;
};

const defaultProps = {
  saveType: SAVE_TYPE_OVERWRITE,
};

class SaveFilterModal extends React.PureComponent<
  SaveFilterModalProps,
  SaveFilterModalState
> {
  static defaultProps = defaultProps;

  modal: ModalTrigger | null;

  url: string;

  constructor(props: SaveFilterModalProps) {
    super(props);
    // this.url = getDashboardUrl({
    //       pathname: window.location.pathname,
    //       filters: getActiveFilters(),
    //       hash: window.location.hash,
    //     });
    // this.setShortUrl(url);

    this.state = {
      saveType: props.saveType,
      newFilterTitle: `${props.dashboardTitle} ${new Date()
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, '/')}`,
      // shortUrl: this.url,
    };
    this.modal = null;
    this.handleSaveTypeChange = this.handleSaveTypeChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.saveFilter = this.saveFilter.bind(this);
    this.setModalRef = this.setModalRef.bind(this);
  }

  // onShortUrlSuccess(shortUrl: string) {
  //   this.setState(() => ({
  //     shortUrl,
  //   }));
  // }
  //
  // setShortUrl(url: string) {
  //   getShortUrl(url)
  //     .then(this.onShortUrlSuccess)
  //     .catch(this.props.addDangerToast);
  // }

  // getCopyUrl(e: React.SyntheticEvent) {
  //   e.stopPropagation();
  //   getShortUrl(this.props.url)
  //     .then(this.onShortUrlSuccess)
  //     .catch(this.props.addDangerToast);
  // }

  setModalRef(ref: ModalTrigger | null) {
    this.modal = ref;
  }

  handleSaveTypeChange(event: RadioChangeEvent) {
    this.setState({
      saveType: (event.target as HTMLInputElement).value as SaveType,
    });
  }

  handleNameChange(name: string) {
    this.setState({
      newFilterTitle: name,
      saveType: SAVE_TYPE_NEWFILTER,
    });
  }

  async saveFilter() {
    const {
      saveType,
      newFilterTitle,
      // shortUrl
    } = this.state;
    const { filterTitle, dashboardId, userId } = this.props;
    const url = getDashboardUrl({
      pathname: window.location.pathname,
      filters: getActiveFilters(),
      hash: window.location.hash,
    });
    const ret = await getShortUrl(url);
    // var ret = shortUrl;

    const data = {
      filterTitle:
        saveType === SAVE_TYPE_NEWFILTER ? newFilterTitle : filterTitle,
      shortUrl: ret,
      userId,
      dashboardId,
    };

    if (saveType === SAVE_TYPE_NEWFILTER && !newFilterTitle) {
      this.props.addDangerToast(
        t('You must pick a name for the new filter set'),
      );
    } else {
      this.writeFilter(data);
      this.props.addSuccessToast(
        t(`Filter set saved with name: "${data.filterTitle}"`),
      );
      this.modal?.close();
    }
  }

  writeFilter(data: any) {
    const existingFilters = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    // existingFilters.push(data);
    existingFilters[data.filterTitle] = data;
    localStorage.setItem(LS_KEY, JSON.stringify(existingFilters));
  }

  readFilter(filterTitle: string) {
    const existingFilters = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return existingFilters[filterTitle];
  }

  save_filterset() {
    // TODO: DON'T CALL API, this should be more like when a new chart is created
    // These data go into psql, not mysql
    // return SupersetClient.post({
    //   endpoint: `/superset/${path}/${id}/`,
    //   postPayload: {
    //     data: {
    //       ...data,
    //       default_filters: safeStringify(serializedFilters),
    //       filter_scopes: safeStringify(serializedFilterScopes),
    //     },
    //   },
    // })
  }

  render() {
    return (
      <ModalTrigger
        ref={this.setModalRef}
        triggerNode={this.props.triggerNode}
        modalTitle={t('Save Currently-Set Filters')}
        modalBody={
          <div>
            <Radio
              value={SAVE_TYPE_OVERWRITE}
              onChange={this.handleSaveTypeChange}
              checked={this.state.saveType === SAVE_TYPE_OVERWRITE}
              disabled={!this.props.canOverwrite}
            >
              {t('Overwrite Filter Set [%s]', this.props.filterTitle)}
            </Radio>
            <hr />
            <Radio
              value={SAVE_TYPE_NEWFILTER}
              onChange={this.handleSaveTypeChange}
              checked={this.state.saveType === SAVE_TYPE_NEWFILTER}
            >
              {t('Save as:')}
            </Radio>
            <Input
              type="text"
              placeholder={t('[filter set name]')}
              value={this.state.newFilterTitle}
              onFocus={e => this.handleNameChange(e.target.value)}
              onChange={e => this.handleNameChange(e.target.value)}
            />
          </div>
        }
        modalFooter={
          <div>
            <Button
              data-test="modal-save-dashboard-button"
              buttonStyle="primary"
              onClick={this.saveFilter}
            >
              {t('Save')}
            </Button>
          </div>
        }
      />
    );
  }
}

export default SaveFilterModal;
