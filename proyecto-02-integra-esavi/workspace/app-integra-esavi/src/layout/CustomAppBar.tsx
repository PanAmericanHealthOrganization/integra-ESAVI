import { AppBar, LoadingIndicator } from "react-admin"

export const CustomAppBar = () => (
  <AppBar
    toolbar={
      <>
        {/* <Authorize allowedRoles={['Administrador']} deniedRoles={['']}>
				<ImportButton />
			</Authorize> */}

        <LoadingIndicator />
      </>
    }
  />
)
