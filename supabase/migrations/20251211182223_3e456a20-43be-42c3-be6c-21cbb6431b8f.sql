-- Inserir configurações padrão do sistema
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES 
  ('promotion_limits', '{"basic_test_max_prizes": 10, "monthly_annual_max_prizes": 100, "basic_test_max_promotions": 3, "monthly_annual_max_promotions": 10}')
ON CONFLICT (setting_key) DO NOTHING;