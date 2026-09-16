import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usersAPI } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  LockClosedIcon,
  PencilIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Profile = () => {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
  });

  const [securityForm, setSecurityForm] = useState({
    username: '',
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => usersAPI.getMe(),
    onSuccess: (data) => {
      console.log('=== Profile data loaded ===', data);
      setProfileForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
      });
      setSecurityForm({
        username: data.username || '',
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => {
      console.log('Отправка данных профиля:', data);
      return usersAPI.updateMe(data);
    },
    onSuccess: (data) => {
      console.log('Успешно обновлен профиль:', data);
      queryClient.invalidateQueries(['user', 'me']);
      setIsEditing(false);
      toast.success('Профиль успешно обновлен');
      
      // Обновляем данные в authStore
      setAuth(
        useAuthStore.getState().token,
        useAuthStore.getState().refreshToken,
        data
      );
    },
    onError: (error) => {
      console.error('Ошибка обновления профиля:', error);
      console.error('Детали ошибки:', error.response);
      toast.error(error.response?.data?.detail || 'Ошибка при обновлении профиля');
    },
  });

  const updateSecurityMutation = useMutation({
    mutationFn: async (data) => {
      // Сначала меняем username если он изменился
      if (data.username && data.username !== userData.username) {
        await usersAPI.updateMe({ username: data.username });
      }
      
      // Потом меняем пароль если указан
      if (data.old_password && data.new_password) {
        await usersAPI.changePassword({
          old_password: data.old_password,
          new_password: data.new_password,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user', 'me']);
      toast.success('Данные безопасности обновлены');
      setSecurityForm({
        ...securityForm,
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Ошибка при обновлении');
    },
  });

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    // Если есть файл аватара, используем FormData
    if (fileInputRef.current?.files?.[0]) {
      const formData = new FormData();
      formData.append('avatar', fileInputRef.current.files[0]);
      formData.append('first_name', profileForm.first_name);
      formData.append('last_name', profileForm.last_name);
      
      console.log('Отправка с аватаром:', {
        avatar: fileInputRef.current.files[0].name,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
      });
      
      updateProfileMutation.mutate(formData);
    } else {
      // Если нет файла, отправляем обычный JSON
      console.log('Отправка без аватара:', profileForm);
      updateProfileMutation.mutate(profileForm);
    }
  };

  const handleSecurityChange = (e) => {
    setSecurityForm({
      ...securityForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    
    // Проверяем что хотя бы что-то меняется
    const isUsernameChanged = securityForm.username !== userData?.username;
    const isPasswordChanging = securityForm.new_password || securityForm.old_password;
    
    if (!isUsernameChanged && !isPasswordChanging) {
      toast.error('Нет изменений для сохранения');
      return;
    }
    
    // Если меняем пароль, проверяем подтверждение
    if (isPasswordChanging) {
      if (!securityForm.old_password) {
        toast.error('Введите текущий пароль');
        return;
      }
      if (securityForm.new_password !== securityForm.confirm_password) {
        toast.error('Новые пароли не совпадают');
        return;
      }
    }
    
    updateSecurityMutation.mutate(securityForm);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5 МБ');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        toast.info('Аватарка будет сохранена после нажатия "Сохранить"');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarPreview(null);
    setProfileForm({
      first_name: userData?.first_name || '',
      last_name: userData?.last_name || '',
    });
  };

  const getRoleLabel = (role) => {
    const roles = {
      cashier: 'Кассир',
      accountant: 'Бухгалтер',
      director: 'Директор',
      admin: 'Администратор',
    };
    return roles[role] || role;
  };

  const getInitials = () => {
    if (userData?.first_name && userData?.last_name) {
      return `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase();
    }
    return userData?.username?.charAt(0).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Профиль</h1>
          <p className="mt-1 text-text-secondary">Управление вашим профилем</p>
        </div>
      </div>

      {/* Вкладки */}
      <div className="card">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`${
                activeTab === 'profile'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              <UserCircleIcon className="h-5 w-5" />
              Информация
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`${
                activeTab === 'security'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
            >
              <LockClosedIcon className="h-5 w-5" />
              Безопасность
            </button>
          </nav>
        </div>

        {/* Вкладка информации о профиле */}
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <form onSubmit={handleProfileSubmit}>
              {/* Аватар, ФИО и роль */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-6">
                  {/* Аватар */}
                  <div className="relative group flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold">{getInitials()}</span>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <CameraIcon className="h-8 w-8 text-white" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* ФИО и роль */}
                  <div className="flex-1 space-y-4">
                    {/* Роль */}
                    <div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary-100 text-primary-800">
                        {getRoleLabel(userData?.role)}
                      </span>
                    </div>
                    
                    {/* ФИО */}
                    <div className="grid grid-cols-2 gap-4 max-w-md">
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="first_name"
                            className="input"
                            placeholder="Имя"
                            value={profileForm.first_name}
                            onChange={handleProfileChange}
                          />
                        ) : (
                          <div className="text-base font-medium text-text-primary">
                            {userData?.first_name || 'Не указано'}
                          </div>
                        )}
                        <div className="text-xs text-text-tertiary mt-1">Имя</div>
                      </div>
                      <div>
                        {isEditing ? (
                          <input
                            type="text"
                            name="last_name"
                            className="input"
                            placeholder="Фамилия"
                            value={profileForm.last_name}
                            onChange={handleProfileChange}
                          />
                        ) : (
                          <div className="text-base font-medium text-text-primary">
                            {userData?.last_name || 'Не указана'}
                          </div>
                        )}
                        <div className="text-xs text-text-tertiary mt-1">Фамилия</div>
                      </div>
                    </div>
                    
                    {isEditing && (
                      <p className="text-xs text-text-tertiary">
                        Нажмите на аватар чтобы изменить фото (макс. 5 МБ)
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Кнопки управления */}
                <div>
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="btn btn-secondary"
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Редактировать
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isLoading}
                        className="btn btn-primary"
                      >
                        <CheckIcon className="h-5 w-5 mr-2" />
                        Сохранить
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="btn btn-ghost"
                      >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Отмена
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        )}

        {/* Вкладка безопасности */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6"
          >
            <div className="max-w-md">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Безопасность</h3>
              <form onSubmit={handleSecuritySubmit} className="space-y-4">
                <div>
                  <label className="label">Имя пользователя (Login)</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="input"
                    placeholder="Введите логин"
                    value={securityForm.username}
                    onChange={handleSecurityChange}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    Используется для входа в систему
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-text-primary mb-3">Изменение пароля</h4>
                  <p className="text-xs text-text-tertiary mb-4">
                    Оставьте поля пустыми, если не хотите менять пароль
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Текущий пароль</label>
                      <input
                        type="password"
                        name="old_password"
                        className="input"
                        placeholder="Введите текущий пароль"
                        value={securityForm.old_password}
                        onChange={handleSecurityChange}
                      />
                    </div>
                    <div>
                      <label className="label">Новый пароль</label>
                      <input
                        type="password"
                        name="new_password"
                        minLength="8"
                        className="input"
                        placeholder="Введите новый пароль"
                        value={securityForm.new_password}
                        onChange={handleSecurityChange}
                      />
                      <p className="text-xs text-text-tertiary mt-1">Минимум 8 символов</p>
                    </div>
                    <div>
                      <label className="label">Подтвердите новый пароль</label>
                      <input
                        type="password"
                        name="confirm_password"
                        minLength="8"
                        className="input"
                        placeholder="Повторите новый пароль"
                        value={securityForm.confirm_password}
                        onChange={handleSecurityChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={updateSecurityMutation.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {updateSecurityMutation.isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;
