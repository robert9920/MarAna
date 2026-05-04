-- Feature: Delete sales with stock restoration
-- Date: 2026-05-04
-- Description: Adds a function to delete a sale and restore product stock.

CREATE OR REPLACE FUNCTION public.delete_sale_with_stock_restore(p_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Restaurar stock y registrar movimientos
  FOR v_item IN
    SELECT si.product_id, si.quantity
    FROM public.sale_items si
    WHERE si.sale_id = p_sale_id
  LOOP
    UPDATE public.products
    SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;

    INSERT INTO public.inventory_movements (product_id, movement_type, quantity, reference_type, reference_id, notes)
    VALUES (v_item.product_id, 'return', v_item.quantity, 'sale_delete', p_sale_id, 'Stock restaurado por eliminación de venta');
  END LOOP;

  -- Eliminar items de venta
  DELETE FROM public.sale_items WHERE sale_id = p_sale_id;

  -- Eliminar venta
  DELETE FROM public.sales WHERE id = p_sale_id;
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION public.delete_sale_with_stock_restore(uuid) TO service_role;
