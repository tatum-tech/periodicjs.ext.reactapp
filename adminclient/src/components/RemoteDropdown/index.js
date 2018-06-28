import _ from 'lodash';
import React, { Component } from 'react';
import { Dropdown, Header } from 'semantic-ui-react';
import utilities from '../../util';
import qs from 'querystring';

class RemoteDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFetching: false,
      multiple: props.multiple || false,
      search: props.search || false,
      searchQuery: null,
      value: props.multiple ? [] : '',
      options: props.default_options || [],
    };
    this.debounce = this.debounce.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  handleChange(cb) {
    const self = this;
    return function (e, { value }) {
      self.setState({ value }, () => {
       if(cb) cb(e, { value })
      })
    }
  }

  debounce(func) {
    var timeout;
    let wait = 1000, immediate = false;
    if (!this.props.debounce) immediate = true;
    else wait = this.props.debounce || 1000;
    const self = this;
    return function () {
      var context = self, args = arguments;
      var later = function () {
        timeout = null;
        func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    }
  }

  handleSearchChange = this.debounce((e, { searchQuery }) => {
    const self = this;
    if (searchQuery && self.state.searchQuery !== searchQuery) {
      self.setState({ searchQuery, isFetching: true }, () => {
        let stateProps = self.props.getState();
        let options = self.props.searchProps;
        let fetchURL = `${stateProps.settings.basename}${options.baseUrl}&${qs.stringify({
          limit: options.limit || 20,
          sort: options.sort,
          query: searchQuery,
          allowSpecialCharacters: true,
        })}`;
        let headers = Object.assign({
          'x-access-token': stateProps.user.jwt_token,
        }, stateProps.settings.userprofile.options.headers);
        utilities.fetchComponent(fetchURL, { headers, })()
          .then(response => {
            let dropdown = response[ options.response_field ].map((item, idx) => ({
              "key": idx,
              "text": item.label,
              "value": item.value,
            }));
            self.setState({ isFetching: false, options: dropdown })
          }, e => {
            self.setState({ isFetching: false, options: [] })
          });
      })
    } else {
      self.setState({ isFetching: false });
    }
  })

  render() {
    const { multiple, options, isFetching, search, value } = this.state
    let passedProps = Object.assign({}, this.props.passProps);
    return (
      <Dropdown
        {...passedProps}
        fluid
        selection
        multiple={multiple}
        search={search}
        options={options}
        value={value}
        placeholder={this.props.placeholder || ''}
        onChange={this.props.onChange? this.handleChange(this.props.onChange) : this.handleChange()}
        onSearchChange={this.handleSearchChange}
        disabled={isFetching}
        loading={isFetching}
      />
    )
  }
}

export default RemoteDropdown