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
import React from 'react';
import { Input, TextArea } from 'src/common/components';
import { FormItem } from 'src/components/Form';
import Button from 'src/components/Button';
import Tabs from 'src/components/Tabs';
import { Select } from 'src/components';
import {
  OptionsType,
  // OptionsTypePage
} from 'src/components/Select/Select';
// import rison from 'rison';
import {
  styled,
  t,
  SupersetClient,
  SupersetClientResponse,
  JsonObject,
} from '@superset-ui/core';

import Modal from 'src/components/Modal';
import ModalTrigger from 'src/components/ModalTrigger';

import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import withToasts from 'src/messageToasts/enhancers/withToasts';
import { DataMaskStateWithId } from 'src/dataMask/types';

import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import {
  getActiveFilters,
} from 'src/dashboard/util/activeDashboardFilters';
// import {
//   getAllActiveFilters,
// //  getRelevantDataMask
// } from 'src/dashboard/util/activeAllDashboardFilters';
import { getShortUrl } from 'src/utils/urlUtils';
// import { FeatureFlag, isFeatureEnabled } from 'src/featureFlags';
const { TabPane } = Tabs;

// const StyledContainer = styled.div`
//   display: flex;
//   flex-direction: row-reverse;
//   justify-content: space-between;
// `;

const StyledRowContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
`;

export const StyledFormItem = styled(FormItem)`
  width: 49%;
  margin-bottom: ${({ theme }) => theme.gridUnit * 4}px;

  & .ant-form-item-label {
    padding-bottom: 0;
  }

  & .ant-form-item-control-input {
    min-height: ${({ theme }) => theme.gridUnit * 10}px;
  }
`;

export const StyledRowFormItem = styled(FormItem)`
  margin-bottom: 0;
  padding-bottom: 0;
  min-width: 50%;

  & .ant-form-item-label {
    padding-bottom: 0;
  }

  .ant-form-item-control-input-content > div > div {
    height: auto;
  }

  & .ant-form-item-control-input {
    min-height: ${({ theme }) => theme.gridUnit * 10}px;
  }
`;

export const StyledRowSubFormItem = styled(FormItem)`
  min-width: 50%;

  & .ant-form-item-label {
    padding-bottom: 0;
  }

  .ant-form-item {
    margin-bottom: 0;
  }

  .ant-form-item-control-input-content > div > div {
    height: auto;
  }

  .ant-form-item-extra {
    display: none;
  }

  & .ant-form-item-control-input {
    height: auto;
  }
`;

export const StyledLabel = styled.span`
  color: ${({ theme }) => theme.colors.grayscale.base};
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  text-transform: uppercase;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    position: sticky;
    margin-left: ${({ theme }) => theme.gridUnit * -4}px;
    margin-right: ${({ theme }) => theme.gridUnit * -4}px;
    top: 0;
    background: white;
    z-index: 1;
  }

  .ant-tabs-nav-list {
    padding: 0;
  }

  .ant-form-item-label {
    padding-bottom: 0;
  }
`;

const FilterSetTabs = {
  save: {
    key: 'save',
    name: t('Save Filter Set'),
  },
  load: {
    key: 'load',
    name: t('Load Filter Set'),
  },
};

const StyledTextArea = styled(TextArea)`
  width: 100%;
`;

const handleErrorResponse = async (
  response: SupersetClientResponse | string,
) => {
  const { error, message } = await getClientErrorObject(response);
  let errorText = error || t('An error has occurred');

  if (typeof message === 'object' && message.json_metadata) {
    errorText = message.json_metadata;
  } else if (typeof message === 'string') {
    errorText = message;

    if (message === 'Forbidden') {
      errorText = t('You do not have permission to edit this Filter Set');
    }
  }

  Modal.error({
    title: 'Error',
    content: errorText,
    okButtonProps: { danger: true, className: 'btn-danger' },
  });
};

export const SAVE_TYPE_OVERWRITE = "overwriteFilter";
export const SAVE_TYPE_NEWFILTER = "newFilter";

import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
// import {
//   getAllActiveFilters,
// //  getRelevantDataMask
// } from 'src/dashboard/util/activeAllDashboardFilters';
import { getShortUrl } from 'src/utils/urlUtils';

type SaveType = typeof SAVE_TYPE_OVERWRITE | typeof SAVE_TYPE_NEWFILTER;

type FilterSetSaveModalProps = {
  addSuccessToast: (arg: string) => void;
  addDangerToast: (arg: string) => void;
  userId: number;
  filterSetTitle: string;
  dashboardTitle: string;
  dashboardId: number;
  description: string;
  saveType: SaveType;
  triggerNode: JSX.Element;
  onSave: (
    data: any,
    id: number | string,
    filterSetTitle: string,
    saveType: SaveType,
  ) => void;
  canOverwrite: boolean;
  lastModifiedTime: number;
  show: boolean;
  dashboardInfo: Record<string, any>;
  layout: Record<string, any>;
  dataMask: DataMaskStateWithId;
};

type FilterSetData = {
  filterSetTitle: string;
  shortUrl: string;
  userId: number;
  description: string | undefined;
  dashboardId: number;
  filterSetId: number;
};

// type FilterSetDataSet = {
//   [key: string]: FilterSetData;
// };

type FilterSetSaveModalState = {
  saveType: SaveType;
  newFilterSetTitle: string;
  newDescription: string | undefined;
  values: {
    api: FilterSetData[];
  };
  activeTabKey: string;
  errors: string[];
  loadUrl: string | undefined;
  description: string | undefined;
  filterSetTitle: string | undefined;
  // filterSets: FilterSetDataSet | undefined;
  filterSetId: number;
};

const defaultProps = {
  saveType: SAVE_TYPE_NEWFILTER,
  show: false,
  description: null,
};

const jsonToFilterSetData = (el: JsonObject): FilterSetData => ({
  filterSetTitle: el.filterSetTitle,
  shortUrl: el.shortUrl,
  userId: el.userId,
  description: el.description,
  dashboardId: el.dashboardId,
  filterSetId: el.filterSetId,
});

class FilterSetSaveModal extends React.PureComponent<
  FilterSetSaveModalProps,
  FilterSetSaveModalState
> {
  static defaultProps = defaultProps;

  modal: ModalTrigger | null;

  url: string;

  constructor(props: FilterSetSaveModalProps) {
    super(props);

    this.state = {
      saveType: props.saveType,
      newFilterSetTitle: `${props.dashboardTitle} ${new Date()
        .toJSON()
        .slice(0, 10)
        .replace(/-/g, '/')}`,
      values: {
        api: [],
      },
      activeTabKey: FilterSetTabs.save.key,
      errors: [],
      newDescription: undefined,
      loadUrl: undefined,
      description: undefined,
      filterSetTitle: undefined,
      // filterSets: undefined,
      filterSetId: 0,
    };
    this.modal = null;
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.saveFilter = this.saveFilter.bind(this);
    this.setModalRef = this.setModalRef.bind(this);
    this.loadFilters = this.loadFilters.bind(this);
    this.deleteFilterSelected = this.deleteFilterSelected.bind(this);
    this.fetchFilterSets = this.fetchFilterSets.bind(this);
    this.getFilterSelect = this.getFilterSelect.bind(this);
    this.onSelectChange = this.onSelectChange.bind(this);
    // load the existing filters for this dashboard
    this.fetchFilterSets();
  }

  getFilterSelect(): OptionsType {
    const { api } = this.state.values;
    return api.map(item => ({
      label: item.filterSetTitle,
      value: item.filterSetId,
    }));
  }

  setModalRef(ref: ModalTrigger) {
    this.modal = ref;
  }

  handleNameChange(name: string) {
    this.setState({
      newFilterSetTitle: name,
      saveType: SAVE_TYPE_NEWFILTER,
    });
  }

  handleDescriptionChange(description: string) {
    this.setState({
      newDescription: description,
      saveType: SAVE_TYPE_NEWFILTER,
    });
  }

  async saveFilter() {
    const { saveType, newFilterSetTitle, newDescription } = this.state;
    const { filterSetTitle, dashboardId, userId, description } = this.props;

    if (saveType === SAVE_TYPE_NEWFILTER && !newFilterSetTitle) {
      this.props.addDangerToast(
        t('You must pick a name for the new filter set'),
      );
      return;
    }
    if (saveType === SAVE_TYPE_NEWFILTER && !newDescription) {
      this.props.addDangerToast(t('You must describe this new filter set'));
      return;
    }

    // var all_filters = getAllActiveFilters({
    //     chartConfiguration: this.props.dashboardInfo.metadata?.chart_configuration,
    //     // dataMask: getRelevantDataMask(this.props.dataMask, 'ownState'),
    //     dataMask: this.props.dataMask,
    //     layout: this.props.layout,
    //     nativeFilters: {},
    // });
    // all_filters = Object.fromEntries(Object.entries(all_filters).map(x => [x[0] + "_bob", x[1]]))

    const filters = getActiveFilters();

    const finalFilters = Object.fromEntries(
      Object.entries({
        ...filters,
        // ...all_filters,
      }).filter(
        (x: [string, { values: any }]) => Object.keys(x[1].values).length,
      ),
    );

    const url = getDashboardUrl({
      dataMask: this.props.dataMask,
      pathname: window.location.pathname,
      filters: finalFilters,
      hash: window.location.hash,
    });
    const ret = await getShortUrl(url);

    const data: FilterSetData = {
      filterSetTitle:
        saveType === SAVE_TYPE_NEWFILTER ? newFilterSetTitle : filterSetTitle,
      shortUrl: ret,
      userId,
      description:
        saveType === SAVE_TYPE_NEWFILTER ? newDescription : description,
      dashboardId,
      filterSetId: -1,
    };

    this.insertFilterSet(data);
    this.props.addSuccessToast(
      t(`Filter set saved with name: "${data.filterSetTitle}"`),
    );
    this.modal?.close();
  }

  deleteFilterSelected() {
    const { filterSetId, filterSetTitle } = this.state;
    if (filterSetId) {
      this.deleteFilterSet(filterSetId);
      this.props.addSuccessToast(
        t(`Filter set deleted with name: "${filterSetTitle}"`),
      );
      this.setState({
        filterSetTitle: '',
        loadUrl: undefined,
        description: undefined,
        filterSetId: 0,
      });
    } else {
      this.props.addDangerToast(t('You must pick a filter set to delete!'));
    }
  }

  filterFilterSetData(
    obj: FilterSetData[],
    prop: string,
    val: any,
  ): FilterSetData {
    const ret = obj.filter(el => el[prop] === val).slice(0, 1)[0];
    return ret;
  }

  loadFilters() {
    const { loadUrl } = this.state;
    if (loadUrl) {
      window.location.href = loadUrl;
    }
  }

  fetchFilterSets() {
    SupersetClient.get({
      endpoint: `/superset/trac/filter_set/${this.props.dashboardId}/`,
    }).then(response => {
      const api = response.json.map(jsonToFilterSetData);

      this.setState(state => ({
        values: {
          ...state.values,
          api,
        },
      }));
    }, handleErrorResponse);
  }

  insertFilterSet(data: FilterSetData) {
    SupersetClient.post({
      endpoint: `/superset/trac/filter_set/${this.props.dashboardId}/`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(() => {
      this.props.addSuccessToast(t('The filter set has been saved'));
      this.fetchFilterSets();
    }, handleErrorResponse);
  }

  deleteFilterSet(filterSetId: number) {
    SupersetClient.put({
      endpoint: `/superset/trac/filter_set/${this.props.dashboardId}/`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fs_id: filterSetId }),
    }).then(() => {
      this.props.addSuccessToast(t('The filter set has been deleted'));
      this.fetchFilterSets();
    }, handleErrorResponse);
  }

  onSelectChange(filterSetId: any) {
    this.setState(prevState => {
      const v = this.filterFilterSetData(
        prevState.values.api,
        'filterSetId',
        filterSetId,
      );
      return {
        loadUrl: v.shortUrl || '',
        description: v.description || '',
        filterSetTitle: v.filterSetTitle || '',
        filterSetId: v.filterSetId || 0,
      };
    });
  }

  render() {
    const { errors, activeTabKey, loadUrl, newFilterSetTitle, description } =
      this.state;
    const options = this.getFilterSelect();

    let deleteButton;
    if (activeTabKey === FilterSetTabs.load.key) {
      deleteButton = (
        <Button
          onClick={this.deleteFilterSelected}
          buttonSize="small"
          buttonStyle="primary"
          className="m-r-5"
          disabled={errors.length > 0}
          cta
        >
          {t('Delete Filter')}
        </Button>
      );
    }

    return (
      <ModalTrigger
        ref={this.setModalRef}
        triggerNode={this.props.triggerNode}
        show={this.props.show}
        onHide={this.modal?.close}
        modalTitle={t('Filter Sets')}
        modalFooter={
          <>
            {deleteButton}
            <Button
              htmlType="button"
              buttonSize="small"
              onClick={this.modal?.close}
              data-test="filter-set-modal-cancel-button"
              cta
            >
              {t('Cancel')}
            </Button>
            <Button
              onClick={
                activeTabKey === FilterSetTabs.save.key
                  ? this.saveFilter
                  : this.loadFilters
              }
              buttonSize="small"
              buttonStyle="primary"
              className="m-r-5"
              disabled={errors.length > 0}
              cta
            >
              {activeTabKey === FilterSetTabs.save.key
                ? t(FilterSetTabs.save.name)
                : t(FilterSetTabs.load.name)}
            </Button>
          </>
        }
        responsive
        modalBody={
          <div style={{ minHeight: '400px' }}>
            <StyledTabs
              activeKey={activeTabKey}
              onChange={activeKey => this.setState({ activeTabKey: activeKey })}
              centered
            >
              <TabPane
                tab={FilterSetTabs.save.name}
                key={FilterSetTabs.save.key}
                forceRender
              >
                <StyledRowContainer>
                  <StyledLabel>{t('Filter Set Name')}</StyledLabel>
                  <Input
                    type="text"
                    placeholder={t('[filter set name]')}
                    value={newFilterSetTitle}
                    onFocus={e => this.handleNameChange(e.target.value)}
                    onChange={e => this.handleNameChange(e.target.value)}
                  />
                </StyledRowContainer>
                <StyledRowContainer>
                  <StyledLabel>{t('Filter Set Description')}</StyledLabel>
                  <StyledTextArea
                    placeholder={t('[description]')}
                    value={this.state.newDescription}
                    onFocus={e => this.handleDescriptionChange(e.target.value)}
                    onChange={e => this.handleDescriptionChange(e.target.value)}
                    rows={10}
                    cols={40}
                  />
                </StyledRowContainer>
              </TabPane>
              <TabPane
                tab={FilterSetTabs.load.name}
                key={FilterSetTabs.load.key}
                forceRender
              >
                <StyledRowFormItem>
                  <StyledLabel>{t('Filter Set Name')}</StyledLabel>
                  <Select
                    allowClear
                    name="filterSetTitles"
                    ariaLabel={t('Existing Filter Sets')}
                    options={options}
                    value={this.state.filterSetTitle}
                    onChange={e => this.onSelectChange(e)}
                  />
                </StyledRowFormItem>
                <StyledRowContainer>
                  <StyledLabel>{t('Filter Set Description')}</StyledLabel>
                  <StyledTextArea
                    name="filterSetDescription"
                    disabled
                    value={description}
                    rows={10}
                  />
                </StyledRowContainer>
                <StyledRowContainer>
                  <StyledLabel>{t('Short URL')}</StyledLabel>
                  <Input
                    type="text"
                    name="filterSetUrl"
                    disabled
                    value={loadUrl}
                  />
                </StyledRowContainer>
              </TabPane>
            </StyledTabs>
          </div>
        }
      />
    );
  }
}

// FilterSetSaveModal.propTypes = propTypes;
// FilterSetSaveModal.defaultProps = defaultProps;

export default withToasts(FilterSetSaveModal);
