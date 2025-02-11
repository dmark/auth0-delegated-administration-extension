import moment from 'moment';
import { fromJS } from 'immutable';

import * as constants from '../constants';
import logTypes from '../utils/logTypes';
import createReducer from '../utils/createReducer';

const initialState = {
  loading: false,
  error: null,
  userId: null,
  record: { },
  memberships: [],
  connection: {},
  logs: {
    loading: false,
    error: null,
    records: []
  },
  devices: {
    loading: false,
    error: null,
    records: { }
  }
};

const userLogs = createReducer(fromJS(initialState.logs), {
  [constants.FETCH_USER_LOGS_PENDING]: (state) =>
    state.merge({
      ...initialState.logs,
      loading: true
    }),
  [constants.FETCH_USER_LOGS_REJECTED]: (state, action) =>
    state.merge({
      ...initialState.logs,
      loading: false,
      error: action.errorData
    }),
  [constants.FETCH_USER_LOGS_FULFILLED]: (state, action) =>
    state.merge({
      loading: false,
      records: fromJS(typeof action.payload.data !== 'undefined' ?
        action.payload.data.map(log => {
          log.time_ago = moment(log.date).fromNow();
          log.shortType = log.type;
          log.type = logTypes[log.type];
          if (!log.type) {
            log.type = {
              event: 'Unknown Log Type',
              icon: {
                name: '354',
                color: '#FFA500'
              }
            };
          }
          return log;
        }) :
        []
      )
    })
});

const userDevices = createReducer(fromJS(initialState.devices), {
  [constants.FETCH_USER_DEVICES_PENDING]: (state) =>
    state.merge({
      ...initialState.devices,
      loading: true
    }),
  [constants.FETCH_USER_DEVICES_REJECTED]: (state, action) =>
    state.merge({
      ...initialState.devices,
      error: action.errorData
    }),
  [constants.FETCH_USER_DEVICES_FULFILLED]: (state, action) => {
    const devices = action.payload.data.devices.reduce((map, device) => {
      map[device.device_name] = (map[device.device_name] || 0) + 1;
      return map;
    }, { });

    return state.merge({
      loading: false,
      records: fromJS(devices)
    });
  }
});

export const user = createReducer(fromJS(initialState), { // eslint-disable-line import/prefer-default-export
  [constants.FETCH_USER_PENDING]: (state, action) =>
    state.merge({
      error: null,
      loading: true,
      userId: action.meta.userId
    }),
  [constants.FETCH_USER_REJECTED]: (state, action) =>
    state.merge({
      loading: false,
      error: action.errorData
    }),
  [constants.FETCH_USER_FULFILLED]: (state, action) => {
    const { data } = action.payload;
    if (data.user.user_id !== state.get('userId')) {
      return state;
    }

    return state.merge({
      loading: false,
      record: fromJS(data.user),
      memberships: fromJS(data.memberships),
      connection: fromJS(data.connection)
    });
  },

  [constants.FETCH_USER_LOGS_PENDING]: (state, action) =>
    state.merge({
      logs: userLogs(state.get('logs'), action)
    }),
  [constants.FETCH_USER_LOGS_REJECTED]: (state, action) =>
    state.merge({
      logs: userLogs(state.get('logs'), action)
    }),
  [constants.FETCH_USER_LOGS_FULFILLED]: (state, action) =>
    state.merge({
      logs: userLogs(state.get('logs'), action)
    }),

  [constants.FETCH_USER_DEVICES_PENDING]: (state, action) =>
    state.merge({
      devices: userDevices(state.get('devices'), action)
    }),
  [constants.FETCH_USER_DEVICES_REJECTED]: (state, action) =>
    state.merge({
      devices: userDevices(state.get('devices'), action)
    }),
  [constants.FETCH_USER_DEVICES_FULFILLED]: (state, action) =>
    state.merge({
      devices: userDevices(state.get('devices'), action)
    })
});
