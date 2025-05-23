import { ReactNode } from 'react';
import scss from './layout.module.scss';

type Props = {
  children: ReactNode,
};

export default function Layout({ children }: Readonly<Props>) {
  return (
    <div id={scss.mainLayout}>
      <div id={scss.contentLayout}>
        <div id={scss.mainContent}>
          {children}
        </div>
      </div>
    </div>
  );
}
