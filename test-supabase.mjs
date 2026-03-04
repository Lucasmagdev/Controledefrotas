#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zxtboztqvnekcmvpzrdx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4dGJvenRxdm5la2NtdnB6cmR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzA3NTgsImV4cCI6MjA4ODIwNjc1OH0.cDWbylXK8P5hCap8itaQsl0omH0zub7C_MEVn5t9g4U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testando conexão com Supabase...\n');

    // Teste 1: Listar registros
    const { data: records, error: listError } = await supabase
      .from('vehicle_records')
      .select('*')
      .limit(5);

    if (listError) {
      console.error('❌ Erro ao listar:', listError.message);
      return;
    }

    console.log(`✅ Conexão OK!`);
    console.log(`📝 Registros encontrados: ${records?.length || 0}\n`);

    if (records && records.length > 0) {
      console.log('Últimos registros:');
      records.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.vehicle_plate} - ${r.status}`);
      });
    } else {
      console.log('⚠️  Nenhum registro encontrado ainda.');
      console.log('   Crie um novo registro pela aplicação web!');
    }

    console.log('\n✅ Sistema pronto para uso!\n');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testConnection();
