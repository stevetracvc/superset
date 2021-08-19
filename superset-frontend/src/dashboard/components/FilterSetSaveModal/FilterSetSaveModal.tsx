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
import
{
  OptionsType,
  // OptionsTypePage
} from 'src/components/Select/Select';
// import rison from 'rison';
import {
  styled,
  t,
  // SupersetClient,
} from '@superset-ui/core';

// import Modal from 'src/components/Modal';
import ModalTrigger from 'src/components/ModalTrigger';

// import { getClientErrorObject } from 'src/utils/getClientErrorObject';
import withToasts from 'src/messageToasts/enhancers/withToasts';
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

const SAVE_TYPE_OVERWRITE = "overwriteFilter";
const SAVE_TYPE_NEWFILTER = "newFilter";

// for localStorage
const LS_KEY = "ls_filter_sets";

import getDashboardUrl from 'src/dashboard/util/getDashboardUrl';
import { getActiveFilters } from 'src/dashboard/util/activeDashboardFilters';
import { getShortUrl } from 'src/utils/urlUtils';

type SaveType = typeof SAVE_TYPE_OVERWRITE | typeof SAVE_TYPE_NEWFILTER;

type FilterSetSaveModalProps = {
  addSuccessToast: (arg: string) => void;
  addDangerToast: (arg: string) => void;
  userId: number;
  filterTitle: string;
  dashboardTitle: string;
  dashboardId: number;
  description: string;
  saveType: SaveType;
  triggerNode: JSX.Element;
  onSave: (data: any, id: number | string,
    filterTitle: string, saveType: SaveType) => void;
  canOverwrite: boolean;
  lastModifiedTime: number;
  show: boolean,
};

type FilterSetSaveModalState = {
  saveType: SaveType;
  newFilterTitle: string;
  newDescription: string | undefined;
  values: object;
  activeTabKey: string;
  errors: string[];
  loadUrl: string | undefined;
  description: string | undefined;
  filterTitle: string | undefined;
  // shortUrl: string;
};

type FilterSetData = {
  filterTitle: string;
  shortUrl: string;
  userId: number;
  description: string | undefined;
  dashboardId: number;
};

type FilterSetDataSet = {
  [key: string]: FilterSetData
};

const defaultProps = {
  saveType: SAVE_TYPE_NEWFILTER,
  show: false,
  description: null,
};

class FilterSetSaveModal extends React.PureComponent<FilterSetSaveModalProps, FilterSetSaveModalState> {
  static defaultProps = defaultProps;

  modal: ModalTrigger | null;
  url: string;

  constructor(props: FilterSetSaveModalProps) {
    super(props);

    this.state = {
      saveType: props.saveType,
      newFilterTitle: `${props.dashboardTitle} ${new Date().toJSON().slice(0,10).replace(/-/g,'/')}`,
      values: {
        // filterTitles: [],
      },
      activeTabKey: FilterSetTabs.save.key,
      errors: [],
      newDescription: undefined,
      loadUrl: undefined,
      description: undefined,
      filterTitle: undefined,
      // shortUrl: this.url,
    };
    this.modal = null;
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.saveFilter = this.saveFilter.bind(this);
    this.setModalRef = this.setModalRef.bind(this);
    this.loadFilters = this.loadFilters.bind(this);
    this.deleteFilterSelected = this.deleteFilterSelected.bind(this);
  }

  getFilterSelect() : OptionsType {
    const { dashboardId } = this.props;
    var lst = Object.entries(this.readFilterAll(dashboardId)) || [];
    // return {
    //   data: lst.map(item => ({
    //     label: item[0],
    //     value: item[1].shortUrl,
    //   })),
    //   totalCount: lst.length,
    // };
    return lst.map(item => ({
        label: item[0],
        value: item[1].shortUrl,
      }));
  }

  setModalRef(ref: ModalTrigger) {
    this.modal = ref;
  }

  handleNameChange(name: string) {
    this.setState({
      newFilterTitle: name,
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
    const { saveType, newFilterTitle, newDescription
      // shortUrl
     } = this.state;
    const { filterTitle, dashboardId, userId, description } = this.props;
    var url = getDashboardUrl({
          pathname: window.location.pathname,
          filters: getActiveFilters(),
          hash: window.location.hash,
        });
    var ret = await getShortUrl(url);
    // var ret = shortUrl;

    const data : FilterSetData = {
      filterTitle:
        saveType === SAVE_TYPE_NEWFILTER ? newFilterTitle : filterTitle,
      shortUrl: ret,
      userId: userId,
      description: saveType === SAVE_TYPE_NEWFILTER ? newDescription : description,
      dashboardId: dashboardId,
    };

    if (saveType === SAVE_TYPE_NEWFILTER && !newFilterTitle) {
      this.props.addDangerToast(
        t('You must pick a name for the new filter set'),
      );
    } else if (saveType === SAVE_TYPE_NEWFILTER && !newDescription) {
      this.props.addDangerToast(
        t('You must describe this new filter set'),
      );
    } else {
      this.writeFilter(data);
      this.props.addSuccessToast(
        t('Filter set saved with name: "' + data.filterTitle + '"'),
      );
      this.modal?.close();
    }
  }

  deleteFilterSelected() {
    const { filterTitle } = this.state;
    if (filterTitle){
      this.deleteFilter(filterTitle);
      this.props.addSuccessToast(
        t('Filter set deleted with name: "' + filterTitle + '"'),
      );
      this.setState({
        filterTitle: undefined,
        loadUrl: undefined,
        description: undefined,
      });
    }
  }

  deleteFilter(filterTitle: string) {
    var existingFilters = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    delete existingFilters[ filterTitle ];
    localStorage.setItem(LS_KEY, JSON.stringify(existingFilters));
  }

  writeFilter(data: FilterSetData) {
    var existingFilters = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    // existingFilters.push(data);
    existingFilters[data.filterTitle] = data;
    localStorage.setItem(LS_KEY, JSON.stringify(existingFilters));
  }

  readFilter(dashboardId: number, filterTitle: string) : FilterSetData {
    // to array for filtering, then back to object
    var existingFilters =
      this.filterFilterSetDataSet(
        JSON.parse(localStorage.getItem(LS_KEY) || '{}'),
        // restrict it to only this dashboard
        "dashboardId", dashboardId);
    return existingFilters[filterTitle];
  }

  readFilterAll(dashboardId: number) : FilterSetDataSet {
    // to array for filtering, then back to object
    var existingFilters =
      this.filterFilterSetDataSet(
        JSON.parse(localStorage.getItem(LS_KEY) || '{}'),
        // restrict it to only this dashboard
        "dashboardId", dashboardId);
    return existingFilters;
  }

  objectFilter(obj: object, prop: string, val: any){
    var ret = Object.fromEntries<typeof obj>(
      Object.entries(obj).filter(el => el[1][prop] == val));
    return ret;
  }

  filterFilterSetData(obj: FilterSetDataSet, prop: string, val: any) : FilterSetData {
    var ret =
      Object.entries(obj).filter(el => el[1][prop] == val).slice(0,1)[0][1];
    return ret;
  }

  filterFilterSetDataSet(obj: FilterSetDataSet, prop: string, val: any) : FilterSetDataSet {
    var ret = Object.fromEntries(
      Object.entries(obj).filter(el => el[1][prop] == val));
    return ret as FilterSetDataSet;
  }

  loadFilters() {
    const { loadUrl } = this.state;
    if (loadUrl){
      window.location.href = loadUrl;
    }
  }

  // onChange(e) {
  //   const { name, value } = e.target;
  //   this.updateFormState(name, value);
  // }

  // fetchDashboardDetails() {
  //   // We fetch the dashboard details because not all code
  //   // that renders this component have all the values we need.
  //   // At some point when we have a more consistent frontend
  //   // datamodel, the dashboard could probably just be passed as a prop.
  //   SupersetClient.get({
  //     endpoint: `/api/v1/dashboard/${this.props.dashboardId}`,
  //   }).then(response => {
  //     const dashboard = response.json.result;
  //     const jsonMetadataObj = dashboard.json_metadata?.length
  //       ? JSON.parse(dashboard.json_metadata)
  //       : {};
  //
  //     this.setState(state => ({
  //       isDashboardLoaded: true,
  //       values: {
  //         ...state.values,
  //         dashboard_title: dashboard.dashboard_title || '',
  //         slug: dashboard.slug || '',
  //         // format json with 2-space indentation
  //         json_metadata: dashboard.json_metadata
  //           ? jsonStringify(jsonMetadataObj)
  //           : '',
  //         colorScheme: jsonMetadataObj.color_scheme,
  //       },
  //     }));
  //     const initialSelectedOwners = dashboard.owners.map(owner => ({
  //       value: owner.id,
  //       label: `${owner.first_name} ${owner.last_name}`,
  //     }));
  //     const initialSelectedRoles = dashboard.roles.map(role => ({
  //       value: role.id,
  //       label: `${role.name}`,
  //     }));
  //     this.onOwnersChange(initialSelectedOwners);
  //     this.onRolesChange(initialSelectedRoles);
  //   }, handleErrorResponse);
  // }

  // updateFormState(name, value) {
  //   this.setState(state => ({
  //     values: {
  //       ...state.values,
  //       [name]: value,
  //     },
  //   }));
  // }

  render() {
    const { errors, activeTabKey, loadUrl,
      newFilterTitle, description } = this.state;
    const { dashboardId } = this.props;
    const options = this.getFilterSelect();
    const allFilters = this.readFilterAll(dashboardId);

    let deleteButton;
    if (activeTabKey === FilterSetTabs.load.key){
      deleteButton = <Button
        onClick={this.deleteFilterSelected}
        buttonSize="small"
        buttonStyle="primary"
        className="m-r-5"
        disabled={errors.length > 0}
        cta
      >
        {t('Delete Filter')}
      </Button>;
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
            <Button
              htmlType="button"
              buttonSize="small"
              onClick={this.modal?.close}
              data-test="filter-set-modal-cancel-button"
              cta
            >
              {t('Cancel')}
            </Button>
            {deleteButton}
            <Button
              onClick={activeTabKey === FilterSetTabs.save.key ?
                 this.saveFilter : this.loadFilters}
              buttonSize="small"
              buttonStyle="primary"
              className="m-r-5"
              disabled={errors.length > 0}
              cta
            >
              {activeTabKey === FilterSetTabs.save.key ?
                 t(FilterSetTabs.save.name) : t(FilterSetTabs.load.name)}
            </Button>
          </>
        }
        responsive
        modalBody={
          <div
            style={{minHeight: '400px'}}
          >
            <StyledTabs
              activeKey={activeTabKey}
              onChange={activeKey => this.setState({activeTabKey: activeKey})}
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
                    value={newFilterTitle}
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
                    name="filterTitles"
                    ariaLabel={t('Existing Filter Sets')}
                    options={options}
                    onChange={url => {
                        this.setState({loadUrl: String(url)});
                        this.setState({description:
                          this.filterFilterSetData(allFilters,
                            "shortUrl", url).description || ""
                        });
                        this.setState({filterTitle:
                          this.filterFilterSetData(allFilters,
                            "shortUrl", url).filterTitle || ""
                        });
                      }
                    }
                  />
                </StyledRowFormItem>
                <StyledRowContainer>
                  <StyledLabel>{t('Filter Set Description')}</StyledLabel>
                  <StyledTextArea
                    name="filterSetDescription"
                    disabled={true}
                    value={description}
                    rows={10}
                  />
                </StyledRowContainer>
                <StyledRowContainer>
                  <StyledLabel>{t('Short URL')}</StyledLabel>
                  <Input
                    type="text"
                    name="filterSetUrl"
                    disabled={true}
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
