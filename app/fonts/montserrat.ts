import LocalFont from "next/font/local";

export const montserrat = LocalFont({
  src: [
    {
      path: './Montserrat-VariableFont_wght.ttf',
      style: 'normal',
    },

    {
      path: './Montserrat-Italic-VariableFont_wght.ttf',
      style: 'italic',
    }
  ]
});


export const montserratSubrayada = LocalFont({
  src: './Montserrat-Subrayada-Regular.woff2',
})