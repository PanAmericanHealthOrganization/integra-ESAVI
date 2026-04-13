import { Layout, LayoutProps } from "react-admin"
import { CustomAppBar } from "./CustomAppBar"
import { CustomMenu } from "./CustomMenu"

export const CustomLayout = (props: LayoutProps) => (
  <>
    <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
  </>
)
