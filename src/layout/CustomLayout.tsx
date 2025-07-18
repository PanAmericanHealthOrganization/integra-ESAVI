import { Layout, LayoutProps } from 'react-admin';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';

export const CustomLayout = (props: LayoutProps) => (
	<>
		<Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
	</>
);
