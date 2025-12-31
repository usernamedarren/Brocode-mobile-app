// Theme constants matching web design
export const Colors = {
  bgColor: '#F8F5F0',
  darkBgColor: '#1A1A1A',
  cardBg: '#FFFFFF',
  darkCardBg: '#2A2A2A',
  textDark: '#1A1A1A',
  textLight: '#FFFFFF',
  textMuted: '#555',
  accentColor: '#C6A96E',
  accentColorDarker: '#AB8F5C',
  borderColor: '#E0D9CD',
  borderDarkColor: '#3A3A3A',
  errorColor: '#ef4444',
};

export const Fonts = {
  heading: 'System', // Will use system default bold
  body: 'System',
};

export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  button: {
    backgroundColor: Colors.accentColor,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.textDark,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
  },
  subheading: {
    fontFamily: Fonts.body,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 16,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textDark,
    lineHeight: 24,
  },
};
