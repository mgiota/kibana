/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { PackageInfo, PackageListItem } from '../../common';

export const getDeferredInstallationsCnt = (pkg?: PackageInfo | PackageListItem | null): number => {
  if (!pkg) return 0;

  const sloAssets =
    pkg &&
    'installationInfo' in pkg &&
    pkg.installationInfo &&
    pkg.installationInfo.installed_kibana?.filter(
      (asset) => asset.type === 'slo' && asset.deferred
    );

  const sloAssetsNum = (sloAssets && sloAssets.length) || 0;

  const deferredAssets =
    pkg &&
    'installationInfo' in pkg &&
    pkg.installationInfo &&
    pkg.installationInfo.installed_es?.filter((d) => d.deferred);
  const deferredAssetsNum = (deferredAssets && deferredAssets.length) || 0;
  return deferredAssetsNum + sloAssetsNum;
};

export const hasDeferredInstallations = (pkg?: PackageInfo | PackageListItem | null): boolean =>
  getDeferredInstallationsCnt(pkg) > 0;
