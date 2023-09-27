/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFormRow, EuiFieldText } from '@elastic/eui';

export function StringParameter({ id, label, value, setParameter }) {
  const handleChange = (evt) => {
    setParameter(id, evt.target.value);
  };

  return (
    <EuiFormRow label={label}>
      <EuiFieldText value={value} onChange={handleChange} fullWidth />
    </EuiFormRow>
  );
}

StringParameter.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  setParameter: PropTypes.func.isRequired,
};
