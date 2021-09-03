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
import {
  getNumberFormatter,
  NumberFormats,
  styled,
  t,
} from '@superset-ui/core';
import React, { useEffect, useState } from 'react';
import { Slider } from 'src/common/components';
import { rgba } from 'emotion-rgba';
import { FormItemProps } from 'antd/lib/form';
import { PluginFilterRangeProps } from './types';
import { StatusMessage, StyledFormItem, FilterPluginStyle } from '../common';
import { getRangeExtraFormData } from '../../utils';

const Wrapper = styled.div<{ validateStatus?: 'error' | 'warning' | 'info' }>`
  ${({ theme, validateStatus }) => `
    border: 1px solid transparent;
    &:focus {
      border: 1px solid
        ${theme.colors[validateStatus || 'primary']?.base};
      outline: 0;
      box-shadow: 0 0 0 3px
        ${rgba(theme.colors[validateStatus || 'primary']?.base, 0.2)};
    }
    & .ant-slider {
      margin-top: ${theme.gridUnit}px;
      margin-bottom: ${theme.gridUnit * 5}px;

      & .ant-slider-track {
        background-color: ${
          validateStatus && theme.colors[validateStatus]?.light1
        };
      }
      & .ant-slider-handle {
        border: ${
          validateStatus && `2px solid ${theme.colors[validateStatus]?.light1}`
        };
        &:focus {
          box-shadow: 0 0 0 3px
            ${rgba(theme.colors[validateStatus || 'primary']?.base, 0.2)};
        }
      }
      &:hover {
        & .ant-slider-track {
          background-color: ${
            validateStatus && theme.colors[validateStatus]?.base
          };
        }
        & .ant-slider-handle {
          border: ${
            validateStatus && `2px solid ${theme.colors[validateStatus]?.base}`
          };
        }
      }
    }
  `}
`;

export default function RangeFilterPlugin(props: PluginFilterRangeProps) {
  const {
    data,
    formData,
    height,
    width,
    setDataMask,
    setFocusedFilter,
    unsetFocusedFilter,
    filterState,
  } = props;
  const numberFormatter = getNumberFormatter(NumberFormats.SMART_NUMBER);

  const [row] = data;
  // @ts-ignore
  const { min, max }: { min: number; max: number } = row;
  const { groupby, defaultValue, inputRef, stepSize, logScale } = formData;
  const [col = ''] = groupby || [];
  const [value, setValue] = useState<[number, number]>(
    defaultValue ?? [min, max],
  );
  const [marks, setMarks] = useState<{ [key: number]: string }>({});
  const transformScale = (val : number) => logScale ? (val > 0 ? Math.log10(val) : 0) : val;
  const inverseScale = (val : number) => logScale ? Math.pow(10, val) : val;

  // value is transformed
  const getBounds = (
    value: [number, number],
  ): { lower: number | null; upper: number | null } => {
    const [lowerRaw, upperRaw] = value;
    return {
      lower: lowerRaw > transformScale(min) ? lowerRaw : null,
      upper: upperRaw < transformScale(max) ? upperRaw : null,
    };
  };

  // lower and upper are NOT transformed!!!!
  const getLabel = (lower: number | null, upper: number | null): string => {
    if (lower !== null && upper !== null) {
      return `${numberFormatter(lower)} ≤ x ≤ ${numberFormatter(upper)}`;
    }
    if (lower !== null) {
      return `x ≥ ${numberFormatter(lower)}`;
    }
    if (upper !== null) {
      return `x ≤ ${numberFormatter(upper)}`;
    }
    return '';
  };

  // lower & upper are transformed
  const getMarks = (
    lower: number | null,
    upper: number | null,
  ): { [key: number]: string } => {
    const newMarks: { [key: number]: string } = {};
    if (lower !== null) {
      newMarks[lower] = numberFormatter(inverseScale(lower));
    }
    if (upper !== null) {
      newMarks[upper] = numberFormatter(inverseScale(upper));
    }
    return newMarks;
  };

  const handleAfterChange = (value: [number, number]): void => {
    // value is transformed
    setValue(value);
    // lower & upper are transformed
    const { lower, upper } = getBounds(value);
    setMarks(getMarks(lower, upper));
    // getRangeExtraFormData emits the filter values
    // label must not be null for badge to work
    setDataMask({
      extraFormData: getRangeExtraFormData(col, inverseScale(Number(lower)), inverseScale(Number(upper))),
      filterState: {
        value: lower !== null || upper !== null ? value : null,
        label: getLabel(inverseScale(Number(lower)), inverseScale(Number(upper))),
      },
    });
  };

  const handleChange = (value: [number, number]) => {
    // value is transformed
    setValue(value);
  };

  // value is transformed
  useEffect(() => {
    // when switch filter type and queriesData still not updated we need ignore this case (in FilterBar)
    if (row?.min === undefined && row?.max === undefined) {
      return;
    }
    handleAfterChange(filterState.value ?? [min, max]);
  }, [JSON.stringify(filterState.value), JSON.stringify(data)]);

  const formItemData: FormItemProps = {};
  if (filterState.validateMessage) {
    formItemData.extra = (
      <StatusMessage status={filterState.validateStatus}>
        {filterState.validateMessage}
      </StatusMessage>
    );
  }

  // let stepSizeUsed = stepSize;
  // if (stepSize === true || (logScale === true && stepSize >= 1)){
  //   stepSizeUsed = 0.01;
  // }
  return (
    <FilterPluginStyle height={height} width={width}>
      {Number.isNaN(Number(min)) || Number.isNaN(Number(max)) ? (
        <h4>{t('Chosen non-numeric column')}</h4>
      ) : (
        <StyledFormItem {...formItemData}>
          <Wrapper
            tabIndex={-1}
            ref={inputRef}
            validateStatus={filterState.validateStatus}
            onFocus={setFocusedFilter}
            onBlur={unsetFocusedFilter}
            onMouseEnter={setFocusedFilter}
            onMouseLeave={unsetFocusedFilter}
          >
            <Slider
              range
              min={transformScale(min) ?? 0}
              max={transformScale(max)}
              value={value ?? [transformScale(min) ?? 0, transformScale(max)]}
              onAfterChange={handleAfterChange}
              onChange={handleChange}
              tipFormatter={val => numberFormatter(inverseScale(Number(val)))}
              marks={marks}
              step={stepSize}
            />
          </Wrapper>
        </StyledFormItem>
      )}
    </FilterPluginStyle>
  );
}
