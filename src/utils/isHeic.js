const isHeic = (file) => {
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif') ||
         file.type === 'image/heic' || file.type === 'image/heif';
};

export default isHeic;
