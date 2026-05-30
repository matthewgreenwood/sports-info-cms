import { Lightning } from '@strapi/icons';

const config = {
  locales: [
    // 'ar',
    // 'fr',
    // 'cs',
    // 'de',
    // 'dk',
    // 'es',
    // 'he',
    // 'id',
    // 'it',
    // 'ja',
    // 'ko',
    // 'ms',
    // 'nl',
    // 'no',
    // 'pl',
    // 'pt-BR',
    // 'pt',
    // 'ru',
    // 'sk',
    // 'sv',
    // 'th',
    // 'tr',
    // 'uk',
    // 'vi',
    // 'zh-Hans',
    // 'zh',
  ],
};

const register = (app) => {
  app.customFields.register({
    name: 'segment-checkboxes',
    type: 'json',
    intlLabel: {
      id: 'segment-checkboxes.label',
      defaultMessage: 'Segments',
    },
    intlDescription: {
      id: 'segment-checkboxes.description',
      defaultMessage: 'Select one or more audience segments to target',
    },
    components: {
      Input: async () => import('./extensions/SegmentCheckboxes'),
    },
  });

  app.customFields.register({
    name: 'news-role-checkboxes',
    type: 'json',
    intlLabel: {
      id: 'news-role-checkboxes.label',
      defaultMessage: 'Visible To Roles',
    },
    intlDescription: {
      id: 'news-role-checkboxes.description',
      defaultMessage: 'Select which accreditation roles can see this news item. Choose "All" to show to everyone.',
    },
    components: {
      Input: async () => import('./extensions/NewsRoleCheckboxes'),
    },
  });

  app.customFields.register({
    name: 'invitation-role-select',
    type: 'json',
    intlLabel: {
      id: 'invitation-role-select.label',
      defaultMessage: 'Role',
    },
    intlDescription: {
      id: 'invitation-role-select.description',
      defaultMessage: 'The Users & Permissions role to assign to this invitee.',
    },
    components: {
      Input: async () => import('./extensions/UserInvitationRoleSelect'),
    },
  });
};

const bootstrap = (app) => {
  // Hide the Marketplace icon from the left navigation
  const style = document.createElement('style');
  style.textContent = `a[href="https://market.strapi.io"] { display: none !important; }`;
  document.head.appendChild(style);

  app.addMenuLink({
    to: '/manage',
    icon: Lightning,
    intlLabel: {
      id: 'accommodation-manage.label',
      defaultMessage: 'Manage',
    },
    permissions: [],
    Component: () => import('./extensions/Manage'),
  });
};

export default {
  
config: {
    translations: {
      en: {
        "Auth.form.welcome.title": "Welcome to the Sports Info Center CMS",
        "Auth.form.welcome.subtitle": "Please log in to continue",
      },
    },
  },

  register,
  bootstrap,
};
