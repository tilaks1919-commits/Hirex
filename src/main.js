import { ROLES, ROUTES, SERVICE_CATEGORIES } from './core/constants.js';
import { formatCurrency } from './core/utils.js';
import { authService, sessionService } from './features/auth/auth-service.js';
import { apiService } from './features/dashboard/api-service.js';
import { appShell, createElement, formField, gradientButton, heroLogo, messageBanner, sectionTitle, softCard, textButton } from './shared/ui.js';

const root = document.getElementById('app');

const state = {
  route: ROUTES.ROLE_SELECTION,
  feedback: '',
  feedbackTone: 'info',
};

const setFeedback = (text = '', tone = 'info') => {
  state.feedback = text;
  state.feedbackTone = tone;
};

const navigate = (route) => {
  state.route = route;
  render();
};

const resolveRouteForSession = () => {
  const user = authService.getCurrentUser();
  if (!user) return ROUTES.ROLE_SELECTION;
  if (user.role === ROLES.ADMIN) return ROUTES.ADMIN_PANEL;
  if (user.role === ROLES.USER) return ROUTES.USER_HOME;
  if (user.role === ROLES.PROVIDER && !user.providerProfileCompleted) return ROUTES.PROVIDER_SETUP;
  return ROUTES.PROVIDER_HOLDING;
};

const createHeader = (title, description) => softCard(
  heroLogo(),
  sectionTitle(title, description),
  state.feedback ? messageBanner(state.feedback, state.feedbackTone) : null,
);

const renderRoleSelection = () => {
  const activeRole = sessionService.getPendingRole();
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('Who are you?', 'Choose your role to personalize authentication and lock routing to the correct experience.'));

  const roleCard = softCard(
    createElement('div', { className: 'stack-lg', children: [
      gradientButton({
        text: 'Hire a Service',
        active: activeRole === ROLES.USER,
        onClick: () => {
          authService.setRoleContext(ROLES.USER);
          setFeedback('Role context set to USER. Continue to secure email authentication.', 'success');
          navigate(ROUTES.AUTH);
        },
      }),
      gradientButton({
        text: 'Service Provider',
        active: activeRole === ROLES.PROVIDER,
        onClick: () => {
          authService.setRoleContext(ROLES.PROVIDER);
          setFeedback('Role context set to PROVIDER. Continue to secure email authentication.', 'success');
          navigate(ROUTES.AUTH);
        },
      }),
    ]}),
  );
  container.appendChild(roleCard);
  return appShell(container);
};

const renderAuthScreen = () => {
  const role = authService.getRoleContext();
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('Email authentication', `Sign in or create your ${role === ROLES.PROVIDER ? 'provider' : 'customer'} account with secure email and password access only.`));

  const emailField = formField({ label: 'Email address', name: 'email', type: 'email', placeholder: 'you@example.com', required: true });
  const passwordField = formField({ label: 'Password', name: 'password', type: 'password', placeholder: 'Minimum 6 characters', required: true });

  const form = createElement('form', { className: 'stack-md' });
  form.append(emailField.wrapper, passwordField.wrapper);
  form.addEventListener('submit', (event) => event.preventDefault());

  const cardChildren = [
    createElement('div', { className: 'pill-row', html: `<span class="role-pill">Current role: ${role}</span>` }),
    form,
    createElement('div', { className: 'stack-sm', children: [
      gradientButton({
        text: 'Login',
        onClick: () => {
          try {
            authService.login({ email: emailField.input.value, password: passwordField.input.value, expectedRole: role });
            setFeedback('Login successful. Role-based access has been validated.', 'success');
            navigate(resolveRouteForSession());
          } catch (error) {
            setFeedback(error.message, 'error');
            render();
          }
        },
      }),
      gradientButton({
        text: 'Signup',
        variant: 'secondary',
        onClick: () => {
          try {
            authService.signup({ email: emailField.input.value, password: passwordField.input.value, role });
            setFeedback('Account created successfully. Routing you to your protected experience.', 'success');
            navigate(resolveRouteForSession());
          } catch (error) {
            setFeedback(error.message, 'error');
            render();
          }
        },
      }),
      textButton({
        text: role === ROLES.PROVIDER ? 'Switch to Hire a Service role' : 'Are you a service provider? Click here',
        onClick: () => {
          authService.setRoleContext(role === ROLES.PROVIDER ? ROLES.USER : ROLES.PROVIDER);
          setFeedback(`Role context switched to ${role === ROLES.PROVIDER ? 'USER' : 'PROVIDER'}.`, 'info');
          render();
        },
      }),
      textButton({
        text: 'Back to role selection',
        subtle: true,
        onClick: () => {
          setFeedback('Choose the role experience you want to continue with.', 'info');
          navigate(ROUTES.ROLE_SELECTION);
        },
      }),
    ]}),
  ];

  if (!authService.adminExists()) {
    cardChildren.push(textButton({
      text: 'Admin Signup (One Time Only)',
      subtle: true,
      onClick: () => {
        setFeedback('Secure admin creation is enabled because no admin exists in the database.', 'info');
        navigate(ROUTES.ADMIN_SIGNUP);
      },
    }));
  }

  container.appendChild(softCard(...cardChildren));
  return appShell(container);
};

const renderAdminSignup = () => {
  if (authService.adminExists()) {
    setFeedback('Admin account already exists. The one-time signup path is now permanently disabled.', 'error');
    navigate(ROUTES.AUTH);
    return appShell(createElement('div'));
  }
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('One-time admin registration', 'Create the single admin account. After success, this entry point is permanently removed from UI and business logic.'));
  const emailField = formField({ label: 'Admin email', name: 'adminEmail', type: 'email', placeholder: 'admin@hirex.com', required: true });
  const passwordField = formField({ label: 'Admin password', name: 'adminPassword', type: 'password', placeholder: 'Secure password', required: true });
  container.appendChild(softCard(
    emailField.wrapper,
    passwordField.wrapper,
    gradientButton({
      text: 'Create Admin Account',
      onClick: () => {
        try {
          authService.createAdmin({ email: emailField.input.value, password: passwordField.input.value });
          setFeedback('Admin account created. The one-time signup control is now disabled forever.', 'success');
          navigate(ROUTES.ADMIN_PANEL);
        } catch (error) {
          setFeedback(error.message, 'error');
          render();
        }
      },
    }),
    textButton({ text: 'Cancel', subtle: true, onClick: () => navigate(ROUTES.AUTH) }),
  ));
  return appShell(container);
};

const renderUserHome = () => {
  let data;
  try {
    data = apiService.getUserHome();
  } catch (error) {
    setFeedback(error.message, 'error');
    navigate(resolveRouteForSession());
    return appShell(createElement('div'));
  }
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('User home', 'Protected customer entry point with future-ready marketplace modules.'));
  container.appendChild(softCard(
    sectionTitle('Nearby help', 'Browse high-intent categories prepared for future matching and booking flows.'),
    createElement('div', { className: 'chip-grid', children: data.nearbyCategories.map((category) => createElement('span', { className: 'category-chip', text: category })) }),
    sectionTitle('Scalable architecture', data.futureModules.join(' • ')),
    textButton({ text: 'Logout', onClick: () => { authService.logout(); setFeedback('Signed out securely.', 'info'); navigate(ROUTES.ROLE_SELECTION); } }),
  ));
  return appShell(container);
};

const renderProviderSetup = () => {
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('Provider setup', 'Complete every profile step before dashboard access is granted. Skipping is disabled by design.'));

  const fullName = formField({ label: 'Full name', name: 'fullName', placeholder: 'Ramesh Kumar', required: true });
  const profileImageName = formField({ label: 'Profile image upload', name: 'profileImage', placeholder: 'profile-photo.png', required: true });
  const gpsLocation = formField({ label: 'GPS location', name: 'gpsLocation', placeholder: '17.3850, 78.4867', required: true });
  const manualLocation = formField({ label: 'Manual address', name: 'manualLocation', placeholder: 'Madhavaram, Chennai', required: true });
  const experienceYears = formField({ label: 'Experience (years)', name: 'experienceYears', type: 'number', placeholder: '5', required: true });
  const hourlyRate = formField({ label: 'Hourly rate', name: 'hourlyRate', type: 'number', placeholder: '35', required: true });
  const phoneNumber = formField({ label: 'Phone number', name: 'phoneNumber', type: 'tel', placeholder: '+1 555 0123', required: true });
  const description = formField({ label: 'Service description', name: 'description', type: 'textarea', placeholder: 'Tell customers about your expertise.', required: true });

  const categorySection = createElement('div', { className: 'stack-sm' });
  categorySection.appendChild(createElement('span', { className: 'field__label', text: 'Service categories' }));
  const selectedCategories = new Set();
  const chips = SERVICE_CATEGORIES.map((category) => {
    const chip = createElement('button', { className: 'category-chip selectable', text: category, attrs: { type: 'button' } });
    chip.addEventListener('click', () => {
      if (selectedCategories.has(category)) {
        selectedCategories.delete(category);
        chip.classList.remove('selected');
      } else {
        selectedCategories.add(category);
        chip.classList.add('selected');
      }
    });
    return chip;
  });
  categorySection.appendChild(createElement('div', { className: 'chip-grid', children: chips }));

  const progress = createElement('div', { className: 'setup-progress', html: `
    <div class="setup-progress__bar"><span style="width: 100%"></span></div>
    <p>Step 1 of 1 • Complete every field to unlock the provider dashboard.</p>
  `});

  container.appendChild(softCard(
    progress,
    fullName.wrapper,
    profileImageName.wrapper,
    gpsLocation.wrapper,
    manualLocation.wrapper,
    categorySection,
    experienceYears.wrapper,
    hourlyRate.wrapper,
    phoneNumber.wrapper,
    description.wrapper,
    gradientButton({
      text: 'Save and continue',
      onClick: () => {
        try {
          if (selectedCategories.size === 0) {
            throw new Error('Select at least one service category.');
          }
          [fullName, profileImageName, gpsLocation, manualLocation, experienceYears, hourlyRate, phoneNumber, description].forEach(({ input }) => {
            if (!String(input.value || '').trim()) {
              throw new Error('Please complete all provider profile fields.');
            }
          });
          authService.completeProviderProfile({
            fullName: fullName.input.value,
            profileImageName: profileImageName.input.value,
            gpsLocation: gpsLocation.input.value,
            manualLocation: manualLocation.input.value,
            serviceCategories: [...selectedCategories],
            experienceYears: experienceYears.input.value,
            hourlyRate: hourlyRate.input.value,
            phoneNumber: phoneNumber.input.value,
            description: description.input.value,
          });
          setFeedback('Provider profile completed. Dashboard access is now unlocked.', 'success');
          navigate(ROUTES.PROVIDER_HOLDING);
        } catch (error) {
          setFeedback(error.message, 'error');
          render();
        }
      },
    })),
  );
  return appShell(container);
};

const renderProviderHolding = () => {
  const setup = apiService.getProviderSetupStatus();
  const profile = setup.profile;
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('Provider onboarding complete', 'The dashboard module can be added later without restructuring the provider domain.'));
  container.appendChild(softCard(
    sectionTitle(profile?.fullName || 'Provider', `${profile?.serviceCategories.join(', ')} • ${formatCurrency(profile?.hourlyRate)}/hr • ${profile?.experienceYears} years experience`),
    createElement('p', { className: 'muted-copy', text: profile?.description || 'Profile summary pending.' }),
    createElement('div', { className: 'metric-grid', html: `
      <div class="metric-card"><strong>${profile?.manualLocation || ''}</strong><span>Service location</span></div>
      <div class="metric-card"><strong>${profile?.phoneNumber || ''}</strong><span>Primary contact</span></div>
      <div class="metric-card"><strong>${profile?.profileImageName || ''}</strong><span>Image asset</span></div>
    `}),
    textButton({ text: 'Logout', onClick: () => { authService.logout(); setFeedback('Signed out securely.', 'info'); navigate(ROUTES.ROLE_SELECTION); } }),
  ));
  return appShell(container);
};

const renderAdminPanel = () => {
  let stats;
  try {
    stats = apiService.getAdminPanelStats();
  } catch (error) {
    setFeedback(error.message, 'error');
    navigate(resolveRouteForSession());
    return appShell(createElement('div'));
  }
  const container = createElement('div', { className: 'screen' });
  container.appendChild(createHeader('Admin panel', 'Protected admin-only workspace with the one-time admin creation rule fully enforced.'));
  container.appendChild(softCard(
    createElement('div', { className: 'metric-grid', html: `
      <div class="metric-card"><strong>${stats.totalUsers}</strong><span>Users</span></div>
      <div class="metric-card"><strong>${stats.totalProviders}</strong><span>Providers</span></div>
      <div class="metric-card"><strong>${stats.hasAdmin ? 'Yes' : 'No'}</strong><span>Admin exists</span></div>
    `}),
    sectionTitle('Future-ready modules', stats.launchModules.join(' • ')),
    textButton({ text: 'Logout', onClick: () => { authService.logout(); setFeedback('Signed out securely.', 'info'); navigate(ROUTES.ROLE_SELECTION); } }),
  ));
  return appShell(container);
};

const render = () => {
  if (!root) return;
  root.innerHTML = '';
  const currentRoute = state.route === ROUTES.ROLE_SELECTION && authService.getCurrentUser()
    ? resolveRouteForSession()
    : state.route;

  let screen;
  switch (currentRoute) {
    case ROUTES.AUTH:
      screen = renderAuthScreen();
      break;
    case ROUTES.ADMIN_SIGNUP:
      screen = renderAdminSignup();
      break;
    case ROUTES.USER_HOME:
      screen = renderUserHome();
      break;
    case ROUTES.PROVIDER_SETUP:
      screen = renderProviderSetup();
      break;
    case ROUTES.PROVIDER_HOLDING:
      screen = renderProviderHolding();
      break;
    case ROUTES.ADMIN_PANEL:
      screen = renderAdminPanel();
      break;
    case ROUTES.ROLE_SELECTION:
    default:
      screen = renderRoleSelection();
  }
  root.appendChild(screen);
};

state.route = resolveRouteForSession();
render();
