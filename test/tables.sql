IF OBJECT_ID('dbo.inventory', 'U') IS NOT NULL
DROP TABLE inventory;

IF OBJECT_ID('dbo.reservation', 'U') IS NOT NULL
DROP TABLE reservation;

IF OBJECT_ID('dbo.version', 'U') IS NOT NULL
DROP TABLE version;

IF OBJECT_ID('dbo.customer', 'U') IS NOT NULL
DROP TABLE customer;

IF OBJECT_ID('dbo.location', 'U') IS NOT NULL
DROP TABLE location;

IF OBJECT_ID('dbo.product', 'U') IS NOT NULL
DROP TABLE product;

IF OBJECT_ID('dbo.session', 'U') IS NOT NULL
DROP TABLE session;

IF OBJECT_ID('sa.movies', 'U') IS NOT NULL
DROP TABLE sa.movies;

IF OBJECT_ID('inventory_view','v') IS NOT NULL
DROP VIEW inventory_view;

GO

  IF NOT EXISTS (
    SELECT  schema_name
    FROM    information_schema.schemata
    WHERE   schema_name = 'sa' )
 
  BEGIN
    EXEC sp_executesql N'CREATE SCHEMA sa'
  END

GO

  create table customer
   (	id varchar(64) not null,
	username varchar(1024),
	email varchar(1024),
	password varchar(1024),
	name varchar(40),
	military_agency varchar(20),
	realm varchar(1024),
	emailverified char(1),
	verificationtoken varchar(1024),
	credentials varchar(1024),
	challenges varchar(1024),
	status varchar(1024),
	created date,
	lastupdated date
   ) ;

  create table inventory
   (	id varchar(64) not null,
	product_id varchar(64),
	location_id varchar(64),
	available integer,
	total integer
   ) ;

  create table reservation
   (	id varchar(64) not null,
	product_id varchar(64),
	location_id varchar(64),
	customer_id varchar(64),
	qty integer,
	status varchar(20),
	reserve_date date,
	pickup_date date,
	return_date date
   ) ;

  create table location
   (	id varchar(64) not null,
	street varchar(64),
	city varchar(64),
	zipcode varchar(16),
	name varchar(32),
	geo varchar(32)
   ) ;

  create table product
   (	id varchar(64) not null,
	name varchar(64),
	audible_range integer,
	effective_range integer,
	rounds integer,
	extras varchar(64),
	fire_modes varchar(64)
   ) ;

  create table session
   (	id varchar(64) not null,
	uid varchar(1024),
	ttl integer
   ) ;
  
  create table version
   (	product_id varchar(64) not null,
	version integer not null
   ) ;

  create table movies
   (	id varchar(64) not null,
	name varchar(1024),
	year integer
   ) ;

  ALTER SCHEMA sa TRANSFER dbo.movies

insert into inventory (id,product_id,location_id,available,total) values ('441','6','91',8,19);
insert into inventory (id,product_id,location_id,available,total) values ('442','7','91',21,23);
insert into inventory (id,product_id,location_id,available,total) values ('443','8','91',35,63);
insert into inventory (id,product_id,location_id,available,total) values ('444','9','91',0,7);
insert into inventory (id,product_id,location_id,available,total) values ('445','10','91',0,2);
insert into inventory (id,product_id,location_id,available,total) values ('446','11','91',1,6);
insert into inventory (id,product_id,location_id,available,total) values ('447','12','91',67,77);
insert into inventory (id,product_id,location_id,available,total) values ('448','13','91',7,51);
insert into inventory (id,product_id,location_id,available,total) values ('449','14','91',39,96);
insert into inventory (id,product_id,location_id,available,total) values ('450','15','91',36,74);
insert into inventory (id,product_id,location_id,available,total) values ('451','16','91',15,73);
insert into inventory (id,product_id,location_id,available,total) values ('453','18','91',0,19);
insert into inventory (id,product_id,location_id,available,total) values ('452','17','91',36,63);
insert into inventory (id,product_id,location_id,available,total) values ('454','19','91',24,94);
insert into inventory (id,product_id,location_id,available,total) values ('455','20','91',8,38);
insert into inventory (id,product_id,location_id,available,total) values ('456','21','91',41,58);
insert into inventory (id,product_id,location_id,available,total) values ('457','22','91',18,22);
insert into inventory (id,product_id,location_id,available,total) values ('458','23','91',25,37);
insert into inventory (id,product_id,location_id,available,total) values ('459','24','91',39,60);
insert into inventory (id,product_id,location_id,available,total) values ('460','25','91',30,55);
insert into inventory (id,product_id,location_id,available,total) values ('461','26','91',4,4);
insert into inventory (id,product_id,location_id,available,total) values ('462','27','91',6,17);
insert into inventory (id,product_id,location_id,available,total) values ('463','28','91',63,82);
insert into inventory (id,product_id,location_id,available,total) values ('464','29','91',30,76);
insert into inventory (id,product_id,location_id,available,total) values ('465','30','91',13,31);
insert into inventory (id,product_id,location_id,available,total) values ('466','31','91',10,59);
insert into inventory (id,product_id,location_id,available,total) values ('467','32','91',39,80);
insert into inventory (id,product_id,location_id,available,total) values ('468','33','91',69,89);
insert into inventory (id,product_id,location_id,available,total) values ('469','34','91',62,93);
insert into inventory (id,product_id,location_id,available,total) values ('470','35','91',13,27);
insert into inventory (id,product_id,location_id,available,total) values ('471','36','91',8,22);
insert into inventory (id,product_id,location_id,available,total) values ('472','37','91',0,31);
insert into inventory (id,product_id,location_id,available,total) values ('473','38','91',9,79);
insert into inventory (id,product_id,location_id,available,total) values ('474','39','91',6,49);
insert into inventory (id,product_id,location_id,available,total) values ('475','40','91',39,40);
insert into inventory (id,product_id,location_id,available,total) values ('476','41','91',1,22);
insert into inventory (id,product_id,location_id,available,total) values ('477','42','91',12,82);
insert into inventory (id,product_id,location_id,available,total) values ('478','43','91',1,7);
insert into inventory (id,product_id,location_id,available,total) values ('479','44','91',15,26);
insert into inventory (id,product_id,location_id,available,total) values ('480','45','91',22,31);
insert into inventory (id,product_id,location_id,available,total) values ('481','46','91',64,65);
insert into inventory (id,product_id,location_id,available,total) values ('482','47','91',10,99);
insert into inventory (id,product_id,location_id,available,total) values ('483','48','91',26,56);
insert into inventory (id,product_id,location_id,available,total) values ('484','49','91',14,19);
insert into inventory (id,product_id,location_id,available,total) values ('485','50','91',51,55);
insert into inventory (id,product_id,location_id,available,total) values ('486','51','91',25,29);
insert into inventory (id,product_id,location_id,available,total) values ('487','52','91',31,37);
insert into inventory (id,product_id,location_id,available,total) values ('488','53','91',35,71);
insert into inventory (id,product_id,location_id,available,total) values ('489','54','91',5,61);
insert into inventory (id,product_id,location_id,available,total) values ('490','55','91',4,26);
insert into inventory (id,product_id,location_id,available,total) values ('491','56','91',29,50);
insert into inventory (id,product_id,location_id,available,total) values ('492','57','91',15,34);
insert into inventory (id,product_id,location_id,available,total) values ('493','58','91',30,38);
insert into inventory (id,product_id,location_id,available,total) values ('494','59','91',54,71);
insert into inventory (id,product_id,location_id,available,total) values ('495','60','91',6,43);
insert into inventory (id,product_id,location_id,available,total) values ('496','61','91',40,80);
insert into inventory (id,product_id,location_id,available,total) values ('497','62','91',32,33);
insert into inventory (id,product_id,location_id,available,total) values ('498','63','91',44,53);
insert into inventory (id,product_id,location_id,available,total) values ('499','64','91',10,68);
insert into inventory (id,product_id,location_id,available,total) values ('500','65','91',11,13);
insert into inventory (id,product_id,location_id,available,total) values ('501','66','91',7,40);
insert into inventory (id,product_id,location_id,available,total) values ('502','67','91',5,20);
insert into inventory (id,product_id,location_id,available,total) values ('503','68','91',30,40);
insert into inventory (id,product_id,location_id,available,total) values ('504','69','91',6,48);
insert into inventory (id,product_id,location_id,available,total) values ('505','70','91',7,53);
insert into inventory (id,product_id,location_id,available,total) values ('506','71','91',2,21);
insert into inventory (id,product_id,location_id,available,total) values ('507','72','91',25,56);
insert into inventory (id,product_id,location_id,available,total) values ('508','73','91',13,85);
insert into inventory (id,product_id,location_id,available,total) values ('509','74','91',63,67);
insert into inventory (id,product_id,location_id,available,total) values ('510','75','91',9,11);
insert into inventory (id,product_id,location_id,available,total) values ('511','76','91',18,46);
insert into inventory (id,product_id,location_id,available,total) values ('512','77','91',7,88);
insert into inventory (id,product_id,location_id,available,total) values ('513','78','91',36,55);
insert into inventory (id,product_id,location_id,available,total) values ('514','79','91',8,33);
insert into inventory (id,product_id,location_id,available,total) values ('515','80','91',63,73);
insert into inventory (id,product_id,location_id,available,total) values ('517','82','91',2,5);
insert into inventory (id,product_id,location_id,available,total) values ('516','81','91',36,71);
insert into inventory (id,product_id,location_id,available,total) values ('518','83','91',11,11);
insert into inventory (id,product_id,location_id,available,total) values ('519','84','91',21,39);
insert into inventory (id,product_id,location_id,available,total) values ('520','85','91',90,91);
insert into inventory (id,product_id,location_id,available,total) values ('521','86','91',1,2);
insert into inventory (id,product_id,location_id,available,total) values ('522','87','91',36,47);
insert into inventory (id,product_id,location_id,available,total) values ('523','2','92',6,7);
insert into inventory (id,product_id,location_id,available,total) values ('524','3','92',15,23);
insert into inventory (id,product_id,location_id,available,total) values ('525','4','92',1,1);
insert into inventory (id,product_id,location_id,available,total) values ('527','6','92',22,24);
insert into inventory (id,product_id,location_id,available,total) values ('526','5','92',37,42);
insert into inventory (id,product_id,location_id,available,total) values ('528','7','92',12,13);
insert into inventory (id,product_id,location_id,available,total) values ('529','8','92',4,25);
insert into inventory (id,product_id,location_id,available,total) values ('531','10','92',9,31);
insert into inventory (id,product_id,location_id,available,total) values ('530','9','92',32,87);
insert into inventory (id,product_id,location_id,available,total) values ('532','11','92',2,38);
insert into inventory (id,product_id,location_id,available,total) values ('533','12','92',66,88);
insert into inventory (id,product_id,location_id,available,total) values ('534','13','92',4,15);
insert into inventory (id,product_id,location_id,available,total) values ('535','14','92',9,88);
insert into inventory (id,product_id,location_id,available,total) values ('536','15','92',18,72);
insert into inventory (id,product_id,location_id,available,total) values ('537','16','92',13,26);
insert into inventory (id,product_id,location_id,available,total) values ('538','17','92',20,55);
insert into inventory (id,product_id,location_id,available,total) values ('539','18','92',17,76);
insert into inventory (id,product_id,location_id,available,total) values ('540','19','92',28,58);
insert into inventory (id,product_id,location_id,available,total) values ('542','21','92',7,12);
insert into inventory (id,product_id,location_id,available,total) values ('541','20','92',78,99);
insert into inventory (id,product_id,location_id,available,total) values ('543','22','92',4,13);
insert into inventory (id,product_id,location_id,available,total) values ('544','23','92',12,96);
insert into inventory (id,product_id,location_id,available,total) values ('545','24','92',82,84);
insert into inventory (id,product_id,location_id,available,total) values ('546','25','92',29,64);
insert into inventory (id,product_id,location_id,available,total) values ('547','26','92',5,7);
insert into inventory (id,product_id,location_id,available,total) values ('548','27','92',3,35);
insert into inventory (id,product_id,location_id,available,total) values ('549','28','92',23,46);
insert into inventory (id,product_id,location_id,available,total) values ('550','29','92',21,39);
insert into inventory (id,product_id,location_id,available,total) values ('551','30','92',19,21);
insert into inventory (id,product_id,location_id,available,total) values ('552','31','92',24,73);
insert into inventory (id,product_id,location_id,available,total) values ('553','32','92',51,89);
insert into inventory (id,product_id,location_id,available,total) values ('554','33','92',22,32);
insert into inventory (id,product_id,location_id,available,total) values ('555','34','92',56,95);
insert into inventory (id,product_id,location_id,available,total) values ('556','35','92',47,95);
insert into inventory (id,product_id,location_id,available,total) values ('557','36','92',17,24);
insert into inventory (id,product_id,location_id,available,total) values ('558','37','92',0,0);
insert into inventory (id,product_id,location_id,available,total) values ('559','38','92',14,53);
insert into inventory (id,product_id,location_id,available,total) values ('560','39','92',65,67);
insert into inventory (id,product_id,location_id,available,total) values ('561','40','92',64,95);
insert into inventory (id,product_id,location_id,available,total) values ('562','41','92',5,5);
insert into inventory (id,product_id,location_id,available,total) values ('563','42','92',7,10);
insert into inventory (id,product_id,location_id,available,total) values ('564','43','92',34,45);
insert into inventory (id,product_id,location_id,available,total) values ('565','44','92',0,3);
insert into inventory (id,product_id,location_id,available,total) values ('566','45','92',20,67);
insert into inventory (id,product_id,location_id,available,total) values ('567','46','92',58,92);
insert into inventory (id,product_id,location_id,available,total) values ('568','47','92',21,70);
insert into inventory (id,product_id,location_id,available,total) values ('569','48','92',56,62);
insert into inventory (id,product_id,location_id,available,total) values ('570','49','92',0,5);
insert into inventory (id,product_id,location_id,available,total) values ('571','50','92',16,97);
insert into inventory (id,product_id,location_id,available,total) values ('572','51','92',6,46);
insert into inventory (id,product_id,location_id,available,total) values ('573','52','92',58,84);
insert into inventory (id,product_id,location_id,available,total) values ('574','53','92',25,42);
insert into inventory (id,product_id,location_id,available,total) values ('575','54','92',13,40);
insert into inventory (id,product_id,location_id,available,total) values ('576','55','92',18,34);
insert into inventory (id,product_id,location_id,available,total) values ('577','56','92',44,92);
insert into inventory (id,product_id,location_id,available,total) values ('578','57','92',0,19);
insert into inventory (id,product_id,location_id,available,total) values ('579','58','92',13,67);
insert into inventory (id,product_id,location_id,available,total) values ('580','59','92',18,38);
insert into inventory (id,product_id,location_id,available,total) values ('581','60','92',7,7);
insert into inventory (id,product_id,location_id,available,total) values ('582','61','92',6,53);
insert into inventory (id,product_id,location_id,available,total) values ('583','62','92',4,25);
insert into inventory (id,product_id,location_id,available,total) values ('584','63','92',31,59);
insert into inventory (id,product_id,location_id,available,total) values ('585','64','92',25,40);
insert into inventory (id,product_id,location_id,available,total) values ('586','65','92',2,81);
insert into inventory (id,product_id,location_id,available,total) values ('587','66','92',23,81);
insert into inventory (id,product_id,location_id,available,total) values ('588','67','92',9,33);
insert into inventory (id,product_id,location_id,available,total) values ('589','68','92',2,37);
insert into inventory (id,product_id,location_id,available,total) values ('590','69','92',53,64);
insert into inventory (id,product_id,location_id,available,total) values ('591','70','92',21,22);
insert into inventory (id,product_id,location_id,available,total) values ('592','71','92',7,45);
insert into inventory (id,product_id,location_id,available,total) values ('593','72','92',9,25);
insert into inventory (id,product_id,location_id,available,total) values ('594','73','92',0,40);
insert into inventory (id,product_id,location_id,available,total) values ('595','74','92',21,34);
insert into inventory (id,product_id,location_id,available,total) values ('596','75','92',33,87);
insert into inventory (id,product_id,location_id,available,total) values ('597','76','92',44,48);
insert into inventory (id,product_id,location_id,available,total) values ('598','77','92',64,69);
insert into inventory (id,product_id,location_id,available,total) values ('599','78','92',31,56);
insert into inventory (id,product_id,location_id,available,total) values ('600','79','92',11,12);
insert into inventory (id,product_id,location_id,available,total) values ('601','80','92',3,7);
insert into inventory (id,product_id,location_id,available,total) values ('602','81','92',26,74);
insert into inventory (id,product_id,location_id,available,total) values ('603','82','92',29,46);
insert into inventory (id,product_id,location_id,available,total) values ('604','83','92',1,5);
insert into inventory (id,product_id,location_id,available,total) values ('605','84','92',35,37);
insert into inventory (id,product_id,location_id,available,total) values ('606','85','92',12,100);
insert into inventory (id,product_id,location_id,available,total) values ('607','86','92',9,18);
insert into inventory (id,product_id,location_id,available,total) values ('608','87','92',49,64);
insert into inventory (id,product_id,location_id,available,total) values ('95','4','87',18,30);
insert into inventory (id,product_id,location_id,available,total) values ('97','6','87',10,21);
insert into inventory (id,product_id,location_id,available,total) values ('96','5','87',3,38);
insert into inventory (id,product_id,location_id,available,total) values ('98','7','87',43,58);
insert into inventory (id,product_id,location_id,available,total) values ('99','8','87',6,12);
insert into inventory (id,product_id,location_id,available,total) values ('100','9','87',0,3);
insert into inventory (id,product_id,location_id,available,total) values ('101','10','87',0,31);
insert into inventory (id,product_id,location_id,available,total) values ('102','11','87',73,93);
insert into inventory (id,product_id,location_id,available,total) values ('103','12','87',22,25);
insert into inventory (id,product_id,location_id,available,total) values ('104','13','87',44,70);
insert into inventory (id,product_id,location_id,available,total) values ('105','14','87',26,50);
insert into inventory (id,product_id,location_id,available,total) values ('106','15','87',36,83);
insert into inventory (id,product_id,location_id,available,total) values ('107','16','87',20,59);
insert into inventory (id,product_id,location_id,available,total) values ('108','17','87',28,44);
insert into inventory (id,product_id,location_id,available,total) values ('109','18','87',5,50);
insert into inventory (id,product_id,location_id,available,total) values ('110','19','87',2,29);
insert into inventory (id,product_id,location_id,available,total) values ('111','20','87',38,54);
insert into inventory (id,product_id,location_id,available,total) values ('112','21','87',4,29);
insert into inventory (id,product_id,location_id,available,total) values ('113','22','87',1,59);
insert into inventory (id,product_id,location_id,available,total) values ('114','23','87',20,36);
insert into inventory (id,product_id,location_id,available,total) values ('115','24','87',10,10);
insert into inventory (id,product_id,location_id,available,total) values ('116','25','87',58,60);
insert into inventory (id,product_id,location_id,available,total) values ('117','26','87',0,18);
insert into inventory (id,product_id,location_id,available,total) values ('118','27','87',29,50);
insert into inventory (id,product_id,location_id,available,total) values ('119','28','87',24,34);
insert into inventory (id,product_id,location_id,available,total) values ('120','29','87',36,43);
insert into inventory (id,product_id,location_id,available,total) values ('121','30','87',43,64);
insert into inventory (id,product_id,location_id,available,total) values ('122','31','87',79,90);
insert into inventory (id,product_id,location_id,available,total) values ('123','32','87',13,13);
insert into inventory (id,product_id,location_id,available,total) values ('124','33','87',9,60);
insert into inventory (id,product_id,location_id,available,total) values ('125','34','87',7,13);
insert into inventory (id,product_id,location_id,available,total) values ('126','35','87',43,54);
insert into inventory (id,product_id,location_id,available,total) values ('127','36','87',67,69);
insert into inventory (id,product_id,location_id,available,total) values ('128','37','87',1,15);
insert into inventory (id,product_id,location_id,available,total) values ('129','38','87',36,44);
insert into inventory (id,product_id,location_id,available,total) values ('130','39','87',1,17);
insert into inventory (id,product_id,location_id,available,total) values ('131','40','87',13,16);
insert into inventory (id,product_id,location_id,available,total) values ('132','41','87',24,64);
insert into inventory (id,product_id,location_id,available,total) values ('133','42','87',87,99);
insert into inventory (id,product_id,location_id,available,total) values ('134','43','87',27,99);
insert into inventory (id,product_id,location_id,available,total) values ('135','44','87',71,71);
insert into inventory (id,product_id,location_id,available,total) values ('136','45','87',9,20);
insert into inventory (id,product_id,location_id,available,total) values ('137','46','87',9,67);
insert into inventory (id,product_id,location_id,available,total) values ('138','47','87',19,21);
insert into inventory (id,product_id,location_id,available,total) values ('139','48','87',5,5);
insert into inventory (id,product_id,location_id,available,total) values ('140','49','87',82,91);
insert into inventory (id,product_id,location_id,available,total) values ('141','50','87',27,42);
insert into inventory (id,product_id,location_id,available,total) values ('142','51','87',51,60);
insert into inventory (id,product_id,location_id,available,total) values ('143','52','87',8,72);
insert into inventory (id,product_id,location_id,available,total) values ('145','54','87',3,71);
insert into inventory (id,product_id,location_id,available,total) values ('144','53','87',5,13);
insert into inventory (id,product_id,location_id,available,total) values ('146','55','87',55,56);
insert into inventory (id,product_id,location_id,available,total) values ('147','56','87',9,90);
insert into inventory (id,product_id,location_id,available,total) values ('148','57','87',3,18);
insert into inventory (id,product_id,location_id,available,total) values ('149','58','87',2,14);
insert into inventory (id,product_id,location_id,available,total) values ('150','59','87',54,95);
insert into inventory (id,product_id,location_id,available,total) values ('151','60','87',62,70);
insert into inventory (id,product_id,location_id,available,total) values ('152','61','87',18,50);
insert into inventory (id,product_id,location_id,available,total) values ('153','62','87',60,78);
insert into inventory (id,product_id,location_id,available,total) values ('154','63','87',23,59);
insert into inventory (id,product_id,location_id,available,total) values ('155','64','87',14,23);
insert into inventory (id,product_id,location_id,available,total) values ('156','65','87',2,97);
insert into inventory (id,product_id,location_id,available,total) values ('157','66','87',49,50);
insert into inventory (id,product_id,location_id,available,total) values ('158','67','87',47,93);
insert into inventory (id,product_id,location_id,available,total) values ('159','68','87',34,42);
insert into inventory (id,product_id,location_id,available,total) values ('160','69','87',3,18);
insert into inventory (id,product_id,location_id,available,total) values ('161','70','87',37,84);
insert into inventory (id,product_id,location_id,available,total) values ('162','71','87',22,40);
insert into inventory (id,product_id,location_id,available,total) values ('163','72','87',8,61);
insert into inventory (id,product_id,location_id,available,total) values ('164','73','87',2,3);
insert into inventory (id,product_id,location_id,available,total) values ('165','74','87',10,16);
insert into inventory (id,product_id,location_id,available,total) values ('166','75','87',53,89);
insert into inventory (id,product_id,location_id,available,total) values ('167','76','87',35,60);
insert into inventory (id,product_id,location_id,available,total) values ('168','77','87',57,80);
insert into inventory (id,product_id,location_id,available,total) values ('169','78','87',53,81);
insert into inventory (id,product_id,location_id,available,total) values ('170','79','87',32,54);
insert into inventory (id,product_id,location_id,available,total) values ('171','80','87',1,4);
insert into inventory (id,product_id,location_id,available,total) values ('172','81','87',78,86);
insert into inventory (id,product_id,location_id,available,total) values ('173','82','87',11,21);
insert into inventory (id,product_id,location_id,available,total) values ('174','83','87',28,81);
insert into inventory (id,product_id,location_id,available,total) values ('175','84','87',2,57);
insert into inventory (id,product_id,location_id,available,total) values ('176','85','87',30,37);
insert into inventory (id,product_id,location_id,available,total) values ('177','86','87',17,80);
insert into inventory (id,product_id,location_id,available,total) values ('179','2','88',10,10);
insert into inventory (id,product_id,location_id,available,total) values ('178','87','87',1,9);
insert into inventory (id,product_id,location_id,available,total) values ('180','3','88',1,1);
insert into inventory (id,product_id,location_id,available,total) values ('181','4','88',8,27);
insert into inventory (id,product_id,location_id,available,total) values ('182','5','88',3,38);
insert into inventory (id,product_id,location_id,available,total) values ('183','6','88',28,76);
insert into inventory (id,product_id,location_id,available,total) values ('184','7','88',40,83);
insert into inventory (id,product_id,location_id,available,total) values ('185','8','88',1,4);
insert into inventory (id,product_id,location_id,available,total) values ('186','9','88',87,95);
insert into inventory (id,product_id,location_id,available,total) values ('187','10','88',29,35);
insert into inventory (id,product_id,location_id,available,total) values ('188','11','88',10,69);
insert into inventory (id,product_id,location_id,available,total) values ('189','12','88',32,86);
insert into inventory (id,product_id,location_id,available,total) values ('190','13','88',27,28);
insert into inventory (id,product_id,location_id,available,total) values ('191','14','88',59,66);
insert into inventory (id,product_id,location_id,available,total) values ('192','15','88',59,70);
insert into inventory (id,product_id,location_id,available,total) values ('193','16','88',43,70);
insert into inventory (id,product_id,location_id,available,total) values ('194','17','88',50,63);
insert into inventory (id,product_id,location_id,available,total) values ('195','18','88',8,20);
insert into inventory (id,product_id,location_id,available,total) values ('196','19','88',20,29);
insert into inventory (id,product_id,location_id,available,total) values ('197','20','88',36,50);
insert into inventory (id,product_id,location_id,available,total) values ('198','21','88',40,63);
insert into inventory (id,product_id,location_id,available,total) values ('199','22','88',4,96);
insert into inventory (id,product_id,location_id,available,total) values ('200','23','88',70,98);
insert into inventory (id,product_id,location_id,available,total) values ('201','24','88',1,1);
insert into inventory (id,product_id,location_id,available,total) values ('202','25','88',17,45);
insert into inventory (id,product_id,location_id,available,total) values ('203','26','88',52,97);
insert into inventory (id,product_id,location_id,available,total) values ('204','27','88',0,0);
insert into inventory (id,product_id,location_id,available,total) values ('205','28','88',97,98);
insert into inventory (id,product_id,location_id,available,total) values ('206','29','88',26,80);
insert into inventory (id,product_id,location_id,available,total) values ('207','30','88',11,33);
insert into inventory (id,product_id,location_id,available,total) values ('208','31','88',10,21);
insert into inventory (id,product_id,location_id,available,total) values ('209','32','88',14,36);
insert into inventory (id,product_id,location_id,available,total) values ('210','33','88',71,86);
insert into inventory (id,product_id,location_id,available,total) values ('211','34','88',85,100);
insert into inventory (id,product_id,location_id,available,total) values ('212','35','88',3,45);
insert into inventory (id,product_id,location_id,available,total) values ('213','36','88',0,3);
insert into inventory (id,product_id,location_id,available,total) values ('214','37','88',17,71);
insert into inventory (id,product_id,location_id,available,total) values ('215','38','88',41,75);
insert into inventory (id,product_id,location_id,available,total) values ('216','39','88',37,41);
insert into inventory (id,product_id,location_id,available,total) values ('217','40','88',37,49);
insert into inventory (id,product_id,location_id,available,total) values ('218','41','88',1,2);
insert into inventory (id,product_id,location_id,available,total) values ('219','42','88',49,72);
insert into inventory (id,product_id,location_id,available,total) values ('220','43','88',24,38);
insert into inventory (id,product_id,location_id,available,total) values ('221','44','88',6,66);
insert into inventory (id,product_id,location_id,available,total) values ('222','45','88',31,49);
insert into inventory (id,product_id,location_id,available,total) values ('223','46','88',9,10);
insert into inventory (id,product_id,location_id,available,total) values ('224','47','88',57,72);
insert into inventory (id,product_id,location_id,available,total) values ('225','48','88',17,24);
insert into inventory (id,product_id,location_id,available,total) values ('226','49','88',41,61);
insert into inventory (id,product_id,location_id,available,total) values ('227','50','88',33,87);
insert into inventory (id,product_id,location_id,available,total) values ('228','51','88',11,25);
insert into inventory (id,product_id,location_id,available,total) values ('229','52','88',1,8);
insert into inventory (id,product_id,location_id,available,total) values ('230','53','88',14,64);
insert into inventory (id,product_id,location_id,available,total) values ('231','54','88',50,89);
insert into inventory (id,product_id,location_id,available,total) values ('232','55','88',16,66);
insert into inventory (id,product_id,location_id,available,total) values ('233','56','88',0,6);
insert into inventory (id,product_id,location_id,available,total) values ('234','57','88',18,32);
insert into inventory (id,product_id,location_id,available,total) values ('235','58','88',6,6);
insert into inventory (id,product_id,location_id,available,total) values ('236','59','88',68,84);
insert into inventory (id,product_id,location_id,available,total) values ('237','60','88',50,74);
insert into inventory (id,product_id,location_id,available,total) values ('238','61','88',7,18);
insert into inventory (id,product_id,location_id,available,total) values ('239','62','88',14,49);
insert into inventory (id,product_id,location_id,available,total) values ('240','63','88',3,3);
insert into inventory (id,product_id,location_id,available,total) values ('241','64','88',21,83);
insert into inventory (id,product_id,location_id,available,total) values ('242','65','88',48,90);
insert into inventory (id,product_id,location_id,available,total) values ('243','66','88',11,65);
insert into inventory (id,product_id,location_id,available,total) values ('244','67','88',29,90);
insert into inventory (id,product_id,location_id,available,total) values ('245','68','88',44,45);
insert into inventory (id,product_id,location_id,available,total) values ('246','69','88',23,30);
insert into inventory (id,product_id,location_id,available,total) values ('247','70','88',53,71);
insert into inventory (id,product_id,location_id,available,total) values ('248','71','88',50,76);
insert into inventory (id,product_id,location_id,available,total) values ('249','72','88',13,20);
insert into inventory (id,product_id,location_id,available,total) values ('250','73','88',6,8);
insert into inventory (id,product_id,location_id,available,total) values ('251','74','88',7,11);
insert into inventory (id,product_id,location_id,available,total) values ('252','75','88',0,3);
insert into inventory (id,product_id,location_id,available,total) values ('253','76','88',49,51);
insert into inventory (id,product_id,location_id,available,total) values ('254','77','88',37,61);
insert into inventory (id,product_id,location_id,available,total) values ('255','78','88',4,78);
insert into inventory (id,product_id,location_id,available,total) values ('257','80','88',23,29);
insert into inventory (id,product_id,location_id,available,total) values ('256','79','88',1,5);
insert into inventory (id,product_id,location_id,available,total) values ('259','82','88',1,2);
insert into inventory (id,product_id,location_id,available,total) values ('258','81','88',3,52);
insert into inventory (id,product_id,location_id,available,total) values ('260','83','88',65,67);
insert into inventory (id,product_id,location_id,available,total) values ('261','84','88',41,87);
insert into inventory (id,product_id,location_id,available,total) values ('262','85','88',20,21);
insert into inventory (id,product_id,location_id,available,total) values ('93','2','87',43,56);
insert into inventory (id,product_id,location_id,available,total) values ('94','3','87',27,85);
insert into inventory (id,product_id,location_id,available,total) values ('263','86','88',46,94);
insert into inventory (id,product_id,location_id,available,total) values ('264','87','88',64,68);
insert into inventory (id,product_id,location_id,available,total) values ('265','2','89',5,78);
insert into inventory (id,product_id,location_id,available,total) values ('266','3','89',29,41);
insert into inventory (id,product_id,location_id,available,total) values ('267','4','89',2,39);
insert into inventory (id,product_id,location_id,available,total) values ('268','5','89',57,67);
insert into inventory (id,product_id,location_id,available,total) values ('269','6','89',1,2);
insert into inventory (id,product_id,location_id,available,total) values ('270','7','89',68,80);
insert into inventory (id,product_id,location_id,available,total) values ('271','8','89',22,81);
insert into inventory (id,product_id,location_id,available,total) values ('272','9','89',9,52);
insert into inventory (id,product_id,location_id,available,total) values ('273','10','89',26,42);
insert into inventory (id,product_id,location_id,available,total) values ('274','11','89',42,91);
insert into inventory (id,product_id,location_id,available,total) values ('275','12','89',23,35);
insert into inventory (id,product_id,location_id,available,total) values ('276','13','89',38,59);
insert into inventory (id,product_id,location_id,available,total) values ('277','14','89',43,51);
insert into inventory (id,product_id,location_id,available,total) values ('278','15','89',19,29);
insert into inventory (id,product_id,location_id,available,total) values ('279','16','89',21,29);
insert into inventory (id,product_id,location_id,available,total) values ('280','17','89',18,47);
insert into inventory (id,product_id,location_id,available,total) values ('281','18','89',26,52);
insert into inventory (id,product_id,location_id,available,total) values ('282','19','89',18,61);
insert into inventory (id,product_id,location_id,available,total) values ('283','20','89',33,97);
insert into inventory (id,product_id,location_id,available,total) values ('284','21','89',1,35);
insert into inventory (id,product_id,location_id,available,total) values ('285','22','89',41,65);
insert into inventory (id,product_id,location_id,available,total) values ('286','23','89',16,41);
insert into inventory (id,product_id,location_id,available,total) values ('287','24','89',26,32);
insert into inventory (id,product_id,location_id,available,total) values ('288','25','89',0,11);
insert into inventory (id,product_id,location_id,available,total) values ('289','26','89',30,52);
insert into inventory (id,product_id,location_id,available,total) values ('290','27','89',29,73);
insert into inventory (id,product_id,location_id,available,total) values ('291','28','89',26,86);
insert into inventory (id,product_id,location_id,available,total) values ('292','29','89',48,48);
insert into inventory (id,product_id,location_id,available,total) values ('293','30','89',0,68);
insert into inventory (id,product_id,location_id,available,total) values ('294','31','89',25,32);
insert into inventory (id,product_id,location_id,available,total) values ('295','32','89',37,80);
insert into inventory (id,product_id,location_id,available,total) values ('296','33','89',12,43);
insert into inventory (id,product_id,location_id,available,total) values ('297','34','89',34,89);
insert into inventory (id,product_id,location_id,available,total) values ('298','35','89',54,97);
insert into inventory (id,product_id,location_id,available,total) values ('299','36','89',2,18);
insert into inventory (id,product_id,location_id,available,total) values ('300','37','89',13,16);
insert into inventory (id,product_id,location_id,available,total) values ('301','38','89',19,54);
insert into inventory (id,product_id,location_id,available,total) values ('302','39','89',16,40);
insert into inventory (id,product_id,location_id,available,total) values ('303','40','89',10,93);
insert into inventory (id,product_id,location_id,available,total) values ('304','41','89',35,39);
insert into inventory (id,product_id,location_id,available,total) values ('305','42','89',24,25);
insert into inventory (id,product_id,location_id,available,total) values ('306','43','89',5,55);
insert into inventory (id,product_id,location_id,available,total) values ('307','44','89',9,43);
insert into inventory (id,product_id,location_id,available,total) values ('308','45','89',36,82);
insert into inventory (id,product_id,location_id,available,total) values ('309','46','89',5,8);
insert into inventory (id,product_id,location_id,available,total) values ('310','47','89',18,20);
insert into inventory (id,product_id,location_id,available,total) values ('311','48','89',2,9);
insert into inventory (id,product_id,location_id,available,total) values ('312','49','89',34,91);
insert into inventory (id,product_id,location_id,available,total) values ('313','50','89',27,55);
insert into inventory (id,product_id,location_id,available,total) values ('314','51','89',11,72);
insert into inventory (id,product_id,location_id,available,total) values ('315','52','89',8,13);
insert into inventory (id,product_id,location_id,available,total) values ('316','53','89',4,31);
insert into inventory (id,product_id,location_id,available,total) values ('317','54','89',1,1);
insert into inventory (id,product_id,location_id,available,total) values ('318','55','89',7,19);
insert into inventory (id,product_id,location_id,available,total) values ('319','56','89',3,35);
insert into inventory (id,product_id,location_id,available,total) values ('320','57','89',58,73);
insert into inventory (id,product_id,location_id,available,total) values ('321','58','89',2,32);
insert into inventory (id,product_id,location_id,available,total) values ('322','59','89',51,64);
insert into inventory (id,product_id,location_id,available,total) values ('323','60','89',34,79);
insert into inventory (id,product_id,location_id,available,total) values ('324','61','89',44,66);
insert into inventory (id,product_id,location_id,available,total) values ('325','62','89',37,46);
insert into inventory (id,product_id,location_id,available,total) values ('326','63','89',10,11);
insert into inventory (id,product_id,location_id,available,total) values ('327','64','89',15,74);
insert into inventory (id,product_id,location_id,available,total) values ('328','65','89',8,19);
insert into inventory (id,product_id,location_id,available,total) values ('329','66','89',13,26);
insert into inventory (id,product_id,location_id,available,total) values ('330','67','89',0,1);
insert into inventory (id,product_id,location_id,available,total) values ('331','68','89',5,17);
insert into inventory (id,product_id,location_id,available,total) values ('332','69','89',0,0);
insert into inventory (id,product_id,location_id,available,total) values ('333','70','89',1,48);
insert into inventory (id,product_id,location_id,available,total) values ('334','71','89',13,70);
insert into inventory (id,product_id,location_id,available,total) values ('335','72','89',24,68);
insert into inventory (id,product_id,location_id,available,total) values ('336','73','89',21,48);
insert into inventory (id,product_id,location_id,available,total) values ('337','74','89',17,68);
insert into inventory (id,product_id,location_id,available,total) values ('338','75','89',72,72);
insert into inventory (id,product_id,location_id,available,total) values ('339','76','89',6,24);
insert into inventory (id,product_id,location_id,available,total) values ('340','77','89',18,22);
insert into inventory (id,product_id,location_id,available,total) values ('341','78','89',8,24);
insert into inventory (id,product_id,location_id,available,total) values ('342','79','89',26,31);
insert into inventory (id,product_id,location_id,available,total) values ('343','80','89',14,19);
insert into inventory (id,product_id,location_id,available,total) values ('344','81','89',10,31);
insert into inventory (id,product_id,location_id,available,total) values ('345','82','89',88,92);
insert into inventory (id,product_id,location_id,available,total) values ('346','83','89',5,11);
insert into inventory (id,product_id,location_id,available,total) values ('347','84','89',13,72);
insert into inventory (id,product_id,location_id,available,total) values ('348','85','89',18,37);
insert into inventory (id,product_id,location_id,available,total) values ('349','86','89',6,12);
insert into inventory (id,product_id,location_id,available,total) values ('350','87','89',79,99);
insert into inventory (id,product_id,location_id,available,total) values ('351','2','90',10,19);
insert into inventory (id,product_id,location_id,available,total) values ('353','4','90',8,38);
insert into inventory (id,product_id,location_id,available,total) values ('352','3','90',3,6);
insert into inventory (id,product_id,location_id,available,total) values ('354','5','90',26,54);
insert into inventory (id,product_id,location_id,available,total) values ('355','6','90',20,73);
insert into inventory (id,product_id,location_id,available,total) values ('356','7','90',30,95);
insert into inventory (id,product_id,location_id,available,total) values ('357','8','90',32,93);
insert into inventory (id,product_id,location_id,available,total) values ('358','9','90',4,18);
insert into inventory (id,product_id,location_id,available,total) values ('359','10','90',32,94);
insert into inventory (id,product_id,location_id,available,total) values ('360','11','90',57,80);
insert into inventory (id,product_id,location_id,available,total) values ('361','12','90',3,6);
insert into inventory (id,product_id,location_id,available,total) values ('362','13','90',40,58);
insert into inventory (id,product_id,location_id,available,total) values ('363','14','90',54,91);
insert into inventory (id,product_id,location_id,available,total) values ('364','15','90',10,11);
insert into inventory (id,product_id,location_id,available,total) values ('365','16','90',34,58);
insert into inventory (id,product_id,location_id,available,total) values ('366','17','90',34,99);
insert into inventory (id,product_id,location_id,available,total) values ('367','18','90',72,90);
insert into inventory (id,product_id,location_id,available,total) values ('368','19','90',13,76);
insert into inventory (id,product_id,location_id,available,total) values ('369','20','90',37,71);
insert into inventory (id,product_id,location_id,available,total) values ('370','21','90',21,39);
insert into inventory (id,product_id,location_id,available,total) values ('371','22','90',4,20);
insert into inventory (id,product_id,location_id,available,total) values ('372','23','90',11,73);
insert into inventory (id,product_id,location_id,available,total) values ('373','24','90',18,100);
insert into inventory (id,product_id,location_id,available,total) values ('375','26','90',0,1);
insert into inventory (id,product_id,location_id,available,total) values ('374','25','90',26,62);
insert into inventory (id,product_id,location_id,available,total) values ('376','27','90',10,28);
insert into inventory (id,product_id,location_id,available,total) values ('377','28','90',68,78);
insert into inventory (id,product_id,location_id,available,total) values ('378','29','90',10,73);
insert into inventory (id,product_id,location_id,available,total) values ('379','30','90',73,96);
insert into inventory (id,product_id,location_id,available,total) values ('380','31','90',35,75);
insert into inventory (id,product_id,location_id,available,total) values ('381','32','90',58,88);
insert into inventory (id,product_id,location_id,available,total) values ('382','33','90',14,26);
insert into inventory (id,product_id,location_id,available,total) values ('383','34','90',22,24);
insert into inventory (id,product_id,location_id,available,total) values ('384','35','90',23,72);
insert into inventory (id,product_id,location_id,available,total) values ('385','36','90',23,59);
insert into inventory (id,product_id,location_id,available,total) values ('387','38','90',51,71);
insert into inventory (id,product_id,location_id,available,total) values ('386','37','90',3,6);
insert into inventory (id,product_id,location_id,available,total) values ('388','39','90',48,60);
insert into inventory (id,product_id,location_id,available,total) values ('389','40','90',44,56);
insert into inventory (id,product_id,location_id,available,total) values ('390','41','90',25,36);
insert into inventory (id,product_id,location_id,available,total) values ('391','42','90',32,83);
insert into inventory (id,product_id,location_id,available,total) values ('392','43','90',77,92);
insert into inventory (id,product_id,location_id,available,total) values ('393','44','90',30,38);
insert into inventory (id,product_id,location_id,available,total) values ('394','45','90',43,49);
insert into inventory (id,product_id,location_id,available,total) values ('395','46','90',23,27);
insert into inventory (id,product_id,location_id,available,total) values ('396','47','90',78,84);
insert into inventory (id,product_id,location_id,available,total) values ('397','48','90',26,48);
insert into inventory (id,product_id,location_id,available,total) values ('398','49','90',15,52);
insert into inventory (id,product_id,location_id,available,total) values ('399','50','90',4,45);
insert into inventory (id,product_id,location_id,available,total) values ('400','51','90',53,77);
insert into inventory (id,product_id,location_id,available,total) values ('401','52','90',5,6);
insert into inventory (id,product_id,location_id,available,total) values ('402','53','90',17,30);
insert into inventory (id,product_id,location_id,available,total) values ('403','54','90',4,44);
insert into inventory (id,product_id,location_id,available,total) values ('404','55','90',12,20);
insert into inventory (id,product_id,location_id,available,total) values ('405','56','90',15,25);
insert into inventory (id,product_id,location_id,available,total) values ('406','57','90',1,33);
insert into inventory (id,product_id,location_id,available,total) values ('407','58','90',22,34);
insert into inventory (id,product_id,location_id,available,total) values ('408','59','90',6,12);
insert into inventory (id,product_id,location_id,available,total) values ('409','60','90',3,9);
insert into inventory (id,product_id,location_id,available,total) values ('410','61','90',41,59);
insert into inventory (id,product_id,location_id,available,total) values ('411','62','90',16,32);
insert into inventory (id,product_id,location_id,available,total) values ('412','63','90',7,15);
insert into inventory (id,product_id,location_id,available,total) values ('413','64','90',49,95);
insert into inventory (id,product_id,location_id,available,total) values ('414','65','90',41,45);
insert into inventory (id,product_id,location_id,available,total) values ('416','67','90',11,39);
insert into inventory (id,product_id,location_id,available,total) values ('415','66','90',18,45);
insert into inventory (id,product_id,location_id,available,total) values ('417','68','90',26,84);
insert into inventory (id,product_id,location_id,available,total) values ('418','69','90',3,4);
insert into inventory (id,product_id,location_id,available,total) values ('419','70','90',72,98);
insert into inventory (id,product_id,location_id,available,total) values ('420','71','90',26,28);
insert into inventory (id,product_id,location_id,available,total) values ('421','72','90',2,2);
insert into inventory (id,product_id,location_id,available,total) values ('422','73','90',57,90);
insert into inventory (id,product_id,location_id,available,total) values ('423','74','90',12,75);
insert into inventory (id,product_id,location_id,available,total) values ('424','75','90',23,37);
insert into inventory (id,product_id,location_id,available,total) values ('425','76','90',22,22);
insert into inventory (id,product_id,location_id,available,total) values ('426','77','90',30,86);
insert into inventory (id,product_id,location_id,available,total) values ('427','78','90',44,82);
insert into inventory (id,product_id,location_id,available,total) values ('428','79','90',13,17);
insert into inventory (id,product_id,location_id,available,total) values ('429','80','90',38,45);
insert into inventory (id,product_id,location_id,available,total) values ('430','81','90',26,91);
insert into inventory (id,product_id,location_id,available,total) values ('431','82','90',34,41);
insert into inventory (id,product_id,location_id,available,total) values ('432','83','90',19,43);
insert into inventory (id,product_id,location_id,available,total) values ('433','84','90',43,43);
insert into inventory (id,product_id,location_id,available,total) values ('434','85','90',34,69);
insert into inventory (id,product_id,location_id,available,total) values ('435','86','90',10,25);
insert into inventory (id,product_id,location_id,available,total) values ('436','87','90',18,34);
insert into inventory (id,product_id,location_id,available,total) values ('437','2','91',25,98);
insert into inventory (id,product_id,location_id,available,total) values ('438','3','91',15,28);
insert into inventory (id,product_id,location_id,available,total) values ('439','4','91',56,97);
insert into inventory (id,product_id,location_id,available,total) values ('440','5','91',20,30);

insert into customer (id,[username],email,password,name,military_agency,realm,emailverified,verificationtoken,credentials,challenges,status,created,lastupdated) values ('612','bat','bat@bar.com','$2a$10$beg18wcyqn7trkfic59eb.vmnsewqjwmlym4dng73izb.mka1rjac',null,null,null,null,null,']',']',null,null,null);
insert into customer (id,username,email,password,name,military_agency,realm,emailverified,verificationtoken,credentials,challenges,status,created,lastupdated) values ('613','baz','baz@bar.com','$2a$10$jksyf2glmdi4cwvqh8astos0b24ldu9p8jccnmri/0rvhtwsicm9c',null,null,null,null,null,']',']',null,null,null);
insert into customer (id,username,email,password,name,military_agency,realm,emailverified,verificationtoken,credentials,challenges,status,created,lastupdated) values ('610','foo','foo@bar.com','$2a$10$tn1hn7xv6x74ccb7tvfwkeaajtd4/6q4rbcmzgmajewe40xqrrsui',null,null,null,null,null,']',']',null,null,null);
insert into customer (id,username,email,password,name,military_agency,realm,emailverified,verificationtoken,credentials,challenges,status,created,lastupdated) values ('611','bar','bar@bar.com','$2a$10$a8mcol6d5vqxm6vubqxl8e5v66steg6e8vzjqqppoyk95vm3smpik',null,null,null,null,null,']',']',null,null,null);

insert into location (id,street,city,zipcode,name,geo) values ('87','7153 east thomas road','scottsdale','85251','phoenix equipment rentals','-111.9271738,33.48034450000001');
insert into location (id,street,city,zipcode,name,geo) values ('91','2799 broadway','new york','10025','cascabel armory','-73.9676965,40.8029807');
insert into location (id,street,city,zipcode,name,geo) values ('89','1850 el camino real','menlo park','94027','military weaponry','-122.194253,37.459525');
insert into location (id,street,city,zipcode,name,geo) values ('92','32/66-70 marine parade','coolangatta','4225','marine parade','153.536972,-28.167598');
insert into location (id,street,city,zipcode,name,geo) values ('90','tolstraat 200','amsterdam','1074','munitions shopmore','4.907475499999999,52.3530638');
insert into location (id,street,city,zipcode,name,geo) values ('88','390 lang road','burlingame','94010','bay area firearms','-122.3381437,37.5874391');

insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('4','m9',53,75,15,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('3','m1911',53,50,7,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('6','makarov sd',0,50,8,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('7','pdw',53,75,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('8','makarov pm',53,50,8,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('9','double-barreled shotgun',90,null,2,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('10','saiga 12k',90,250,8,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('11','remington 870 (flashlight)',90,null,8,'flashlight','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('12','revolver',53,100,6,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('13','winchester 1866',125,150,15,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('14','bizon pp-19 sd',0,100,64,'silenced','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('15','mp5sd6',0,100,30,'silenced','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('16','mp5a5',53,100,30,null,'single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('17','ak-107',80,400,30,'kobra sight','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('18','ak-107 gl',80,null,30,'kobra sight','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('19','ak-107 gl pso',80,400,30,'scope,gp-25 launcher]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('20','ak-107 pso',80,600,30,'scope','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('21','ak-74',80,300,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('22','akm',149,400,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('23','aks',149,200,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('24','aks (gold)',149,200,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('25','m1014',90,null,8,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('26','aks-74 kobra',80,300,30,'kobra sight','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('27','aks-74 pso',80,400,30,'scope','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('28','aks-74u',80,200,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('29','aks-74un kobra',0,300,30,'kobra sight,silenced]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('30','ak-74 gp-25',80,300,30,'gp-25 launcher','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('31','fn fal an/pvs-4',180,400,20,'nv scope','single,burst]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('32','g36',80,400,30,'scope,aimpoint sight]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('33','fn fal',180,400,20,null,'single,burst]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('34','g36 c',80,300,30,null,'single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('35','g36-c sd (camo)',0,300,30,'aimpoint sight,silenced]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('36','g36a (camo)',80,400,30,'scope,aimpoint sight]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('37','g36c (camo)',80,300,30,null,'single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('38','g36 k',80,400,30,'scope,aimpoint sight]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('39','g36c-sd',0,300,30,'aimpoint sight','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('40','g36k (camo)',80,400,30,'scope,aimpoint sight]','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('41','l85a2 acog gl',80,600,30,'acog scope,m203 launcher]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('42','l85a2 susat',80,300,30,'susat optical scope','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('43','m16a2',80,400,30,null,'single,burst]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('44','l85a2 aws',80,300,30,'thermal scope,nv scope,laser sight,variable zoom]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('45','l85a2 holo',80,300,30,'holographic sight','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('46','lee enfield',162,400,10,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('47','m16a4 acog',80,600,30,'acog scope','single,burst]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('49','m16a2 m203',80,400,30,'m203 launcher','single,burst]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('48','m4a1',80,300,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('50','m4a1 holo',80,300,30,'holographic sight,m203 launcher]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('51','m4a1 cco',80,300,30,'aimpoint sight','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('52','m4a1 cco sd',0,200,30,'aimpoint sight,silenced]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('53','m4a1 m203 rco',80,600,30,'acog sight,m203 launcher]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('54','m4a3 cco',80,300,30,'aimpoint sight,flashlight]','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('55','rpk',80,400,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('56','sa-58 cco',149,300,30,'aimpoint sight','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('57','sa-58p',149,400,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('58','sa-58v',149,200,30,null,'single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('59','sa-58v acog',149,400,30,'acog sight','single,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('60','er7 rfw',180,2000,25,'scope,aimpoint sight]','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('61','as50',455,1600,5,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('62','ksvk',455,800,5,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('63','cz550',180,800,5,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('64','dmr',180,800,20,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('65','m107',455,1200,10,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('66','m24',180,800,5,'scope','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('67','m40a3',180,800,5,'scope,camo]','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('68','m14 aim',180,500,20,'aimpoint sight','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('69','m240',180,400,100,null,'full auto');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('70','mg36',80,400,100,'aimpoint sight','single,burst,full auto]');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('72','pkm',180,400,100,null,'full auto');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('71','svd camo',180,1200,10,'scope,camo]','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('73','mk 48 mod 0',180,400,100,'aimpoint sight','full auto');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('74','m249 saw',80,300,200,null,'full auto');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('75','crowbar',2,1,null,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('76','hatchet',2,1,null,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('77','pkp',180,600,100,'scope','full auto');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('78','machete',2,1,null,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('79','m67 frag grenade',null,null,null,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('80','compound crossbow',3,30,1,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('81','smoke grenade',null,null,null,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('82','m136 launcher',160,1000,1,null,'single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('83','30rnd. ak sd',0,null,30,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('84','30rnd g36 sd',0,null,30,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('85','g36 mag.',80,null,30,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('86','flashlight',null,null,null,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('87','nv goggles',null,null,null,null,null);
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('2','g17',53,75,15,'flashlight','single');
insert into product (id,name,audible_range,effective_range,rounds,extras,fire_modes) values ('5','m9 sd',0,75,15,'silenced','single');

  alter table inventory add constraint inventory_pk primary key (id);
  alter table location add constraint location_pk primary key (id);

  alter table customer add constraint customer_pk primary key (id);
  alter table product add constraint product_pk primary key (id);
  alter table session add constraint session_pk primary key (id);
  alter table version add constraint version_pk primary key (product_id, version);

  alter table inventory add constraint location_fk foreign key (location_id) references location (id);
  alter table inventory add constraint product_fk foreign key (product_id) references product (id);

  alter table reservation add constraint reservation_customer_fk foreign key (customer_id) references customer (id);
  alter table reservation add constraint reservation_location_fk foreign key (location_id) references location (id);
  alter table reservation add constraint reservation_product_fk foreign key (product_id) references product (id);
  alter table version add constraint version_product_fk foreign key (product_id) references product (id);

GO

  create view inventory_view
                  as
    select p.name as product,
      l.name      as location,
      i.available
    from inventory i,
      product p,
      location l
    where p.id = i.product_id
    and l.id   = i.location_id;
