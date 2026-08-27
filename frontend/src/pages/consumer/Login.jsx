import React from 'react';
import LoginForm from '../../components/auth/LoginForm.jsx';

export default function ConsumerLogin() {
  return <LoginForm registerLinkTo="/register/consumer" />;
}
