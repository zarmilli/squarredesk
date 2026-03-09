const getImagePrefix = () => {
  return process.env.NODE_ENV === "production"
    ? "/Crypgo/"
    : "";
};

export { getImagePrefix };
 
