<?php
$cities = [
    '連江縣' => '09007',
    '金門縣' => '09020',
    '宜蘭縣' => '10002',
    '彰化縣' => '10007',
    '南投縣' => '10008',
    '雲林縣' => '10009',
    '屏東縣' => '10013',
    '臺東縣' => '10014',
    '花蓮縣' => '10015',
    '澎湖縣' => '10016',
    '基隆市' => '10017',
    '新竹市' => '10018',
    '臺北市' => '63000',
    '新北市' => '65000',
    '臺中市' => '66000',
    '臺南市' => '67000',
    '桃園市' => '68000',
    '苗栗縣' => '10005',
    '新竹縣' => '10004',
    '嘉義市' => '10020',
    '嘉義縣' => '10010',
    '高雄市' => '64000',
];

$topics = [
    '17' => '79b8adc5242fb9232566f29a3114eddd',
    '18' => '896b2dbb2f0c83084b9ca99d12b4a2d2',
    '19' => '450483c187d6249faeca40711f00f45d',
    '20' => 'aad5b411b067a25611f7082f8fd6807c',
];

$pool = [];
$areaPool = [];
$cunli = json_decode(file_get_contents('/home/kiang/public_html/taiwan_basecode/cunli/topo/20210324.json'), true);
foreach ($cunli['objects']['20210324']['geometries'] as $obj) {
    $p = $obj['properties'];
    if (empty($p['VILLNAME'])) {
        continue;
    }
    if (!isset($pool[$p['COUNTYCODE']])) {
        $pool[$p['COUNTYCODE']] = [];
    }
    $areaPool[$p['TOWNCODE']] = $p['COUNTYNAME'] . $p['TOWNNAME'];
    $townCode = substr($p['TOWNCODE'], 5);
    if (!isset($pool[$p['COUNTYCODE']][$townCode])) {
        $pool[$p['COUNTYCODE']][$townCode] = [];
    }
    $cunliCode = substr($p['VILLCODE'], 8);
    $pool[$p['COUNTYCODE']][$townCode][$cunliCode] = $p['VILLNAME'];
}

$jsonPath = dirname(__DIR__) . '/json';
if (!file_exists($jsonPath)) {
    mkdir($jsonPath);
}

$result = [];
foreach ($cities as $city => $code) {
    $code1 = substr($code, 0, 2);
    $code2 = substr($code, 2, 3);
    foreach ($topics as $num => $ucode) {
        $jsonFile = $jsonPath . '/' . $num . '_' . $code . '.json';
        if (!file_exists($jsonFile)) {
            $url = "https://referendums.2021.nat.gov.tw/static/referendums/data/tickets/N/{$ucode}/L/{$code1}_{$code2}_00_000_0000.json";
            file_put_contents($jsonFile, file_get_contents($url));
        }
        $json = json_decode(file_get_contents($jsonFile), true);
        foreach ($json as $area) {
            foreach ($area as $cunli) {
                $cityCode = $cunli['prv_code'] . $cunli['city_code'];
                $items = explode('、', $cunli['area_name']);
                foreach ($items as $item) {
                    $key = array_search($item, $pool[$cityCode][$cunli['dept_code']]);
                    if (false === $key) {
                        $liCode = substr($cunli['li_code'], 1, 3);
                        if (!isset($pool[$cityCode][$cunli['dept_code']][$liCode])) {
                            switch ($cunli['area_name']) {
                                case '德鹿谷村':
                                    $key = '007';
                                    break;
                                case '三和村':
                                    $key = false;
                                    break;
                            }
                        } else {
                            $key = $liCode;
                        }
                    }
                    if(false !== $key) {
                        $villCode = $cityCode . $cunli['dept_code'] . $key;
                        if(!isset($result[$villCode])) {
                            $result[$villCode] = [
                                'votable_population' => $cunli['votable_population'],
                            ];
                        }
                        $result[$villCode][$num . '_agree'] = $cunli['agree_ticket'];
                        $result[$villCode][$num . '_disagree'] = $cunli['disagree_ticket'];
                    }
                }
            }
        }
    }
}

file_put_contents(dirname(__DIR__) . '/docs/data.json', json_encode($result));