export const isEncryptedError = (err) => {
  return err.name === 'PasswordException' ||
         err.name === 'EncryptedPDFError' ||
         (err.message && (
           err.message.toLowerCase().includes('password') ||
           err.message.toLowerCase().includes('encrypt')
         ));
};
