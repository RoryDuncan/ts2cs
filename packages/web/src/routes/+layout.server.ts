import type { LayoutServerLoad } from "./$types";

const packageVersion = "v.0.0";

export const load: LayoutServerLoad = () => {
  return {
    packageVersion
  };
};
