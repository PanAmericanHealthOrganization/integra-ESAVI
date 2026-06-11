import { Box } from '@mui/material';
import { Layout, LayoutProps } from 'react-admin';
import { CustomMenu } from './CustomMenu';
import { CustomAppBar } from './CustomAppBar';
import { CustomFooter } from './CustomFooter';
  
export const CustomLayout = (props: LayoutProps) => (
	<>
		<Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
		<CustomFooter />
	</>
);
