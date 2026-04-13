import { useState } from "react"
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  SxProps,
  Theme,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import ZoomInIcon from "@mui/icons-material/ZoomIn"
import { ImageField, ImageFieldProps, useRecordContext } from "react-admin"

interface ImageFieldWithZoomProps extends ImageFieldProps {
  sx?: SxProps<Theme>
}

export const ImageFieldWithZoom = (props: ImageFieldWithZoomProps) => {
  const { source, sx, ...rest } = props
  const record = useRecordContext()
  const [open, setOpen] = useState(false)

  if (!record || !source) {
    return null
  }

  const imageUrl = record[source as string]

  if (!imageUrl) {
    return <ImageField source={source} {...rest} sx={sx} />
  }

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <>
      <Box
        sx={{
          position: "relative",
          cursor: "pointer",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover .zoom-icon": {
            opacity: 1,
          },
          ...sx,
        }}
        onClick={handleClickOpen}>
        <ImageField
          source={source}
          {...rest}
          sx={{
            width: "100%",
            height: "100%",
            "& img": {
              width: "100%",
              height: "auto",
              maxWidth: "100%",
              objectFit: "contain",
            },
            ...sx,
          }}
        />
        <Box
          className="zoom-icon"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderRadius: "50%",
            padding: "8px",
            opacity: 0,
            transition: "opacity 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}>
          <ZoomInIcon sx={{ color: "white", fontSize: 24 }} />
        </Box>
      </Box>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            width: "50vw",
            height: "50vh",
            maxWidth: "50vw",
            maxHeight: "50vh",
            margin: "auto",
          },
        }}>
        <DialogContent
          sx={{
            padding: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: "white",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
              },
              zIndex: 1,
            }}>
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={imageUrl}
            alt={props.title || "Imagen ampliada"}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ImageFieldWithZoom
