import classNames from '@lib/class-names/ClassNames';
import type { PanelProps } from '@lib/plume-admin-theme/panel/PanelProps';
import React from 'react';

import scss from './panel.module.scss';

export default function Panel({ className, children }: Readonly<PanelProps>) {
  return <div className={classNames(scss.panel, className)}>{children}</div>;
}
